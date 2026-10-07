#!/usr/bin/env bash
# Render and install the host Caddy site blocks for one instance.
#
#   akd-mi caddy <slug>              print the rendered blocks, write nothing
#   sudo akd-mi caddy <slug> --install
#   sudo akd-mi caddy <slug> --remove
#
# One file per instance under /etc/caddy/sites/, so creating or destroying an
# institution adds or removes exactly that file and nothing else. Caddy is handed
# literal values, never the instance .env — a process that needs hostnames and
# ports should not hold the database password and the MinIO root credentials.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Normally exported by akd-mi.sh. Defaulted here too so this stays runnable on its
# own — which matters because the way you reach it is `sudo`, and sudo does not
# carry the caller's environment across.
PROJECT_DIR="${PROJECT_DIR:-$(dirname "$SCRIPT_DIR")}"
INSTANCES_DIR="${INSTANCES_DIR:-$PROJECT_DIR/instances}"
TEMPLATES_DIR="${TEMPLATES_DIR:-$PROJECT_DIR/templates}"
source "$SCRIPT_DIR/lib/common.sh"

# Two shapes: one instance by slug, or the portal with --portal in place of it.
TARGET="${1:?usage: caddy-site.sh <slug>|--portal [--install|--remove]}"
shift || true
MODE="instance"
SLUG=""
if [[ "$TARGET" == "--portal" ]]; then
    MODE="portal"
else
    SLUG="$TARGET"
fi
ACTION="print"
for arg in "$@"; do
    # akd-mi.sh dispatches with "${ARGS[@]:-}", which expands to one EMPTY string
    # when there are no extra args — so a bare `akd-mi caddy <slug>` arrives here
    # with "" and must not be read as an unknown option.
    [[ -z "$arg" ]] && continue
    case "$arg" in
        --install) ACTION="install" ;;
        --remove)  ACTION="remove" ;;
        *) err "Unknown option: $arg"; exit 1 ;;
    esac
done

SITE_DIR="/etc/caddy/sites"
MAIN_CADDYFILE="/etc/caddy/Caddyfile"
IMPORT_LINE="import $SITE_DIR/*.caddyfile"
if [[ "$MODE" == "portal" ]]; then
    SITE_FILE="$SITE_DIR/akdmi-portal.caddyfile"
    LABEL="the portal"
else
    validate_slug "$SLUG"
    SITE_FILE="$SITE_DIR/akdmi-${SLUG}.caddyfile"
    LABEL="instance '$SLUG'"
fi

if [[ "$ACTION" == "remove" ]]; then
    [[ "$(id -u)" -eq 0 ]] || { err "--remove writes under /etc/caddy — re-run with sudo."; exit 1; }
    if [[ -f "$SITE_FILE" ]]; then
        rm -f "$SITE_FILE"
        ok "Removed $SITE_FILE ($LABEL)"
        systemctl reload caddy && ok "caddy reloaded" || warn "caddy did not reload — check 'systemctl status caddy'."
    else
        info "No site file for $LABEL ($SITE_FILE) — nothing to remove."
    fi
    exit 0
fi

if [[ "$MODE" == "portal" ]]; then
    TEMPLATE="$TEMPLATES_DIR/caddy-portal.caddyfile"
    [[ -f "$TEMPLATE" ]] || { err "Missing $TEMPLATE"; exit 1; }
    PORTAL_ENV="$PROJECT_DIR/portal/.env"
    [[ -f "$PORTAL_ENV" ]] || { err "Missing $PORTAL_ENV — copy portal/.env.example and fill it in."; exit 1; }
    read_portal() { sed -n "s/^$1=//p" "$PORTAL_ENV" | tail -n1; }
    PORTAL_HOST="$(read_portal PORTAL_HOST)"
    PORTAL_PORT="$(read_portal PORTAL_PORT)"; : "${PORTAL_PORT:=3099}"
    BIND_HOST="$(read_portal BIND_HOST)"
    if [[ -z "$PORTAL_HOST" ]]; then
        err "PORTAL_HOST is not set in portal/.env."
        echo "  Add the hostname Caddy should answer for, e.g."
        echo "    PORTAL_HOST=portal.akd-mi.75-119-136-160.nip.io"
        exit 1
    fi
    render() {
        sed -e "s|{\$PORTAL_HOST}|$PORTAL_HOST|g" \
            -e "s|{\$PORTAL_PORT}|$PORTAL_PORT|g" \
            "$TEMPLATE"
    }
    ROUTES="  https://$PORTAL_HOST  -> 127.0.0.1:$PORTAL_PORT  (portal)"
else

require_instance_exists "$SLUG"
load_instance_env "$SLUG"

TEMPLATE="$TEMPLATES_DIR/caddy.caddyfile"
[[ -f "$TEMPLATE" ]] || { err "Missing $TEMPLATE"; exit 1; }

for v in WEB_HOST API_HOST MEDIA_HOST; do
    if [[ -z "${!v:-}" ]]; then
        err "$v is not set in instances/$SLUG/.env."
        echo "  That instance was created without a base domain, so it has no public"
        echo "  hostnames to route — only localhost:PORT URLs. Re-create it with"
        echo "  AKDMI_BASE_DOMAIN set, or add WEB_HOST/API_HOST/MEDIA_HOST by hand."
        exit 1
    fi
done

# The whole point of binding to loopback: the instance must not be reachable
# around the proxy, in plain http, on the ports it exposes for Caddy.
if [[ -n "${BIND_HOST:-}" && "$BIND_HOST" != "127.0.0.1" && "$BIND_HOST" != "localhost" ]]; then
    warn "BIND_HOST is '$BIND_HOST', not 127.0.0.1 — this instance is published on every"
    warn "  interface, so it answers in plain http around Caddy. Fix it in the instance"
    warn "  .env and re-run 'akd-mi up $SLUG'."
fi

render() {
    sed -e "s|{\$WEB_HOST}|$WEB_HOST|g" \
        -e "s|{\$API_HOST}|$API_HOST|g" \
        -e "s|{\$MEDIA_HOST}|$MEDIA_HOST|g" \
        -e "s|{\$WEB_PORT}|$WEB_PORT|g" \
        -e "s|{\$API_PORT}|$API_PORT|g" \
        -e "s|{\$MINIO_PORT}|$MINIO_PORT|g" \
        "$TEMPLATE"
}
ROUTES="  https://$WEB_HOST     -> 127.0.0.1:$WEB_PORT    (web)
  https://$API_HOST     -> 127.0.0.1:$API_PORT    (api)
  https://$MEDIA_HOST   -> 127.0.0.1:$MINIO_PORT  (public media)"

fi

if [[ "$ACTION" == "print" ]]; then
    # Only the rendered config may touch stdout — this output is meant to be piped
    # (`akd-mi caddy <slug> > site.caddyfile`, or into `caddy validate`). common.sh's
    # info() writes to stdout, so saying anything friendly here without redirecting
    # puts it in the config, where Caddy reads it as a site address and fails with
    # "subject does not qualify for certificate".
    render
    if [[ "$MODE" == "portal" ]]; then
        { echo; info "Nothing was written. To install: sudo akd-mi caddy-portal --install"; } >&2
    else
        { echo; info "Nothing was written. To install: sudo akd-mi caddy $SLUG --install"; } >&2
    fi
    exit 0
fi

step "Installing Caddy site for $LABEL"
[[ "$(id -u)" -eq 0 ]] || { err "--install writes under /etc/caddy — re-run with sudo."; exit 1; }
command -v caddy >/dev/null 2>&1 || {
    err "caddy is not installed on this host."
    echo "  https://caddyserver.com/docs/install#debian-ubuntu-raspbian"
    exit 1
}

install -d -m 0755 "$SITE_DIR"
render > "$SITE_FILE.new"
chmod 0644 "$SITE_FILE.new"

# Caddy reads one Caddyfile. A per-instance file is worth nothing until the main
# one imports the directory, and a missing import is silent: Caddy reloads happily
# and simply never answers for these hosts.
if [[ ! -f "$MAIN_CADDYFILE" ]]; then
    printf '%s\n' "$IMPORT_LINE" > "$MAIN_CADDYFILE"
    ok "Created $MAIN_CADDYFILE with the import"
elif ! grep -qF "$SITE_DIR" "$MAIN_CADDYFILE"; then
    printf '\n# Per-app site blocks, one file each.\n%s\n' "$IMPORT_LINE" >> "$MAIN_CADDYFILE"
    ok "Added the import to $MAIN_CADDYFILE"
fi

mv "$SITE_FILE.new" "$SITE_FILE"
ok "$SITE_FILE"

# Validate before reloading. A reload on a bad config leaves the old one serving
# and still reports success, so the next restart — days later, for an unrelated
# reason — is what actually takes every site on this box down.
if caddy validate --config "$MAIN_CADDYFILE" --adapter caddyfile >/dev/null 2>&1; then
    ok "Config validates"
else
    caddy validate --config "$MAIN_CADDYFILE" --adapter caddyfile || true
    rm -f "$SITE_FILE"
    err "The Caddyfile does not validate. This site file has been removed"
    echo "  again and Caddy was NOT reloaded, so the other instances are untouched."
    echo "  An 'ambiguous site definition' means one of these hostnames is already"
    echo "  defined elsewhere — most likely another instance claimed the same slug."
    exit 1
fi

# Validation passing does not mean loading will: it checks syntax, not whether a
# port can be bound or a file opened. Never hide this behind `&& ok`.
if systemctl reload caddy; then
    ok "caddy reloaded"
else
    systemctl status caddy --no-pager --lines=15 >&2 || true
    err "caddy did not reload, so $LABEL is NOT live. The previously running config"
    echo "  is still serving, so the other instances are unaffected — but a"
    echo "  'systemctl restart caddy' would now fail and take them down too."
    exit 1
fi

echo
info "Routed:"
echo "$ROUTES"
echo
info "Certificates are issued on first request; watch: journalctl -u caddy -f"
