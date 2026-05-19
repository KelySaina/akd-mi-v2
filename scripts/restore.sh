#!/usr/bin/env bash
# Restore a database dump (.sql.gz) into an instance
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"

SLUG="$1"; DUMP="${2:-}"
require_instance_exists "$SLUG"
[[ -z "$DUMP" || ! -f "$DUMP" ]] && { err "Usage: akd-mi restore <slug> <dump.sql.gz>"; exit 1; }

warn "This will OVERWRITE the database of instance '$SLUG'."
read -r -p "Continue? (y/N) " yn
[[ "$yn" =~ ^[Yy]$ ]] || { err "Aborted."; exit 1; }

step "Restoring database from $DUMP"
gunzip -c "$DUMP" | compose_cmd "$SLUG" exec -T db psql -U akdmi -d "akdmi_$SLUG"
ok "Restore complete."
