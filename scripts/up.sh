#!/usr/bin/env bash
# Start an instance (build images if needed, run migrations, seed if first run)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"

SLUG="$1"
require_instance_exists "$SLUG"

step "Starting instance: $SLUG"

step "Pulling/building images"
compose_cmd "$SLUG" build --pull

step "Starting containers"
compose_cmd "$SLUG" up -d

step "Waiting for database"
for i in {1..30}; do
    if compose_cmd "$SLUG" exec -T db pg_isready -U akdmi >/dev/null 2>&1; then
        ok "Database ready"
        break
    fi
    sleep 1
    [[ $i -eq 30 ]] && { err "Database did not become ready in time"; exit 1; }
done

step "Syncing database schema"
# Prefer migrate deploy when migrations exist, otherwise fall back to db push.
# Either path MUST succeed before we try to seed.
if compose_cmd "$SLUG" exec -T api test -d prisma/migrations; then
    if ! compose_cmd "$SLUG" exec -T api npx prisma migrate deploy; then
        err "prisma migrate deploy failed"
        exit 1
    fi
else
    info "No prisma/migrations directory — using 'prisma db push' to sync schema"
    if ! compose_cmd "$SLUG" exec -T api npx prisma db push --skip-generate --accept-data-loss; then
        err "prisma db push failed — database schema not created"
        exit 1
    fi
fi
ok "Schema in sync"

# Seed only on first start
INSTANCE_DIR="$INSTANCES_DIR/$SLUG"
SEED_MARKER="$INSTANCE_DIR/.seeded"
if [[ ! -f "$SEED_MARKER" ]]; then
    step "Seeding initial admin"
    if compose_cmd "$SLUG" exec -T api node dist/scripts/seed.js; then
        touch "$SEED_MARKER"
        ok "Seed complete"
    else
        warn "Seed failed (you can run 'akd-mi seed $SLUG' manually later)"
    fi
fi

load_instance_env "$SLUG"
echo
ok "Instance '$SLUG' is up."
echo "  Web:    $PUBLIC_WEB_URL"
echo "  API:    $PUBLIC_API_URL"
echo "  MinIO:  http://localhost:${MINIO_UI_PORT}  (user: $MINIO_ROOT_USER)"
