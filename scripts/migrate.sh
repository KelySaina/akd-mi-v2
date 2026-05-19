#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"
SLUG="$1"
require_instance_exists "$SLUG"
step "Running Prisma migrations for $SLUG"
compose_cmd "$SLUG" exec -T api npx prisma migrate deploy
ok "Migrations applied"
