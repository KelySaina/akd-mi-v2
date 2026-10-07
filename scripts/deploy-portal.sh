#!/usr/bin/env bash
# ============================================================================
# AKD-MI — portal deploy step (run BY the CI/CD workflow over SSH).
#
# Expects in the environment:
#   IMAGE_TAG      git SHA to deploy
#   GITHUB_TOKEN   optional — authenticates `git fetch` while the repo is private
#
# Flow: sync the checkout to the SHA -> preflight -> rebuild the portal ->
# migrate -> poll the portal -> on failure, roll back to the last good SHA.
#
# This replaces a workflow that ran on a self-hosted runner ON this box and
# rsync'd the working directory into place. That coupled "can we build" to "is
# the server up", gave the runner write access to the deploy directory, and left
# no record of which commit was actually deployed. Now the build and tests run on
# GitHub's runners and only this script touches the server — the same shape as
# the other two stacks on this host.
# ============================================================================
set -euo pipefail

: "${IMAGE_TAG:?IMAGE_TAG is required}"

# Must match AKDMI_PROJECT_DIR in portal/.env: the portal bind-mounts the project
# at the SAME path inside its container as on the host, so `docker compose
# --project-directory` resolves identically whether the CLI runs in the container
# or the daemon acts on it. Deploying somewhere else silently breaks instance
# provisioning rather than this script.
DEPLOY_DIR="${AKDMI_PROJECT_DIR:-/opt/akd-mi-v2}"
LAST_GOOD_FILE=".deployed_tag"
HEALTH_RETRIES=24   # 24 * 5s = up to 2 minutes for build + migrate + boot
HEALTH_DELAY=5

log() { printf '\n\033[36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[31m==> %s\033[0m\n' "$*" >&2; exit 1; }

[ -d "$DEPLOY_DIR/.git" ] ||
  die "$DEPLOY_DIR is not a git checkout. Bootstrap it once:
       sudo install -d -o \$USER -g \$USER $DEPLOY_DIR
       git clone <repo> $DEPLOY_DIR
       cp $DEPLOY_DIR/portal/.env.example $DEPLOY_DIR/portal/.env  # then fill it in"

cd "$DEPLOY_DIR"

read_env() { sed -n "s/^$1=//p" portal/.env 2>/dev/null | tail -n1; }

preflight() {
  [ -f portal/.env ] ||
    die "portal/.env is missing. Copy portal/.env.example to it and fill it in —
       JWT_SECRET and PORTAL_DB_PASSWORD at minimum, or the portal boots with
       the placeholder values from the example."

  for key in JWT_SECRET PORTAL_DB_PASSWORD; do
    v="$(read_env "$key")"
    case "$v" in
      ""|changeme|please-change-me*)
        die "$key in portal/.env is empty or still the placeholder. The portal holds
       the provisioning records for every institution and mounts the docker
       socket; it does not get to run on 'changeme'." ;;
    esac
  done

  # The proxy is outside this stack, so a deploy cannot start it — but it can
  # decline to poll an https:// URL nothing was ever going to answer.
  PORTAL_HOST="$(read_env PORTAL_HOST)"
  if [ -n "$PORTAL_HOST" ]; then
    command -v caddy >/dev/null 2>&1 ||
      die "PORTAL_HOST is set to '$PORTAL_HOST' but caddy is not installed here."
    systemctl is-active --quiet caddy ||
      die "caddy is installed but not running — 'systemctl status caddy' says why."
    grep -rqF "$PORTAL_HOST" /etc/caddy 2>/dev/null ||
      die "no Caddy site answers for ${PORTAL_HOST}.
       Run: sudo ./scripts/caddy-site.sh --portal --install"
  fi

  case "$(read_env BIND_HOST)" in
    ""|127.0.0.1|localhost) ;;
    *) die "BIND_HOST in portal/.env is '$(read_env BIND_HOST)' — the portal and its
       database would be published on every interface, in plain http, around
       Caddy. Set it to 127.0.0.1." ;;
  esac
}

log "Syncing $DEPLOY_DIR to ${IMAGE_TAG}"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  git -c http.https://github.com/.extraheader="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 | tr -d '\n')" \
    fetch --all --prune --quiet
else
  git fetch --all --prune --quiet
fi
git checkout --force "$IMAGE_TAG"

PREV_TAG="$(cat "$LAST_GOOD_FILE" 2>/dev/null || true)"
PORTAL_PORT="$(read_env PORTAL_PORT)"; : "${PORTAL_PORT:=3099}"
HEALTH_URL="http://127.0.0.1:${PORTAL_PORT}/"

deploy_tag() {
  local tag="$1"
  log "Deploying ${tag}"
  # CRLF defence: .gitattributes should handle it, but bash refuses to parse a
  # script with CR line endings ("set: pipefail\r: invalid option name") and the
  # failure reads as a broken script rather than a line-ending problem.
  find . -type f \( -name '*.sh' -o -name 'akd-mi' \) \
    -not -path './node_modules/*' -not -path './.next/*' -exec sed -i 's/\r$//' {} + 2>/dev/null || true
  chmod +x ./akd-mi 2>/dev/null || true
  find ./scripts -type f -name '*.sh' -exec chmod +x {} + 2>/dev/null || true

  ( cd portal && docker compose up -d --build portal-db portal-web )
}

migrate() {
  log "Applying portal migrations"
  # The runtime image ships no Prisma CLI, so npx fetches it. Pinned to v6: the
  # schema still uses datasource.url, which v7 dropped.
  if [ -d portal/prisma/migrations ] && [ -n "$(ls -A portal/prisma/migrations 2>/dev/null)" ]; then
    ( cd portal && docker compose exec -T portal-web npx -y prisma@6 migrate deploy )
  else
    echo "  no prisma/migrations — falling back to 'prisma db push'"
    ( cd portal && docker compose exec -T portal-web npx -y prisma@6 db push --accept-data-loss )
  fi
}

health_ok() {
  log "Health-checking ${HEALTH_URL}"
  for i in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS --max-time 5 -o /dev/null "$HEALTH_URL"; then
      echo "  healthy after ${i} attempt(s)"
      return 0
    fi
    sleep "$HEALTH_DELAY"
  done
  return 1
}

preflight
deploy_tag "$IMAGE_TAG"
sleep 5
migrate

if health_ok; then
  echo "$IMAGE_TAG" > "$LAST_GOOD_FILE"
  log "Deploy OK: ${IMAGE_TAG}"
  docker image prune -f >/dev/null 2>&1 || true
else
  log "Health check FAILED for ${IMAGE_TAG}"
  if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$IMAGE_TAG" ]; then
    # Honest limitation: this rolls back code, not the portal database. The
    # migration above is forward-only, so a bad one needs a hand-written reverse.
    # It also does NOT touch running instances — they are separate compose
    # projects and keep serving whatever they were already serving, which is the
    # behaviour you want: a bad portal build must not take the schools offline.
    log "Rolling back to ${PREV_TAG}"
    git checkout --force "$PREV_TAG" || true
    deploy_tag "$PREV_TAG"
    health_ok && echo "  rollback healthy" || echo "  !! rollback also unhealthy — needs manual attention"
  else
    echo "  no previous good tag recorded — leaving as-is for inspection"
  fi
  exit 1
fi
