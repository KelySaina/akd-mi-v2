#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"
SLUG="$1"
require_instance_exists "$SLUG"
step "Running Prisma migrations for $SLUG"
if compose_cmd "$SLUG" exec -T api test -d prisma/migrations; then
    compose_cmd "$SLUG" exec -T api npx prisma migrate deploy
else
    info "No prisma/migrations directory — using 'prisma db push' to sync schema"
    compose_cmd "$SLUG" exec -T api npx prisma db push --skip-generate --accept-data-loss
fi
ok "Migrations applied"
