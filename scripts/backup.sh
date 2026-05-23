#!/usr/bin/env bash
# Backup an instance: pg_dump + uploads tarball
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"

SLUG="$1"
require_instance_exists "$SLUG"
mkdir -p "$BACKUPS_DIR/$SLUG"

TS=$(date -u +%Y%m%d-%H%M%S)
OUT_DB="$BACKUPS_DIR/$SLUG/db-$TS.sql.gz"
OUT_FILES="$BACKUPS_DIR/$SLUG/uploads-$TS.tar.gz"

step "Dumping database"
compose_cmd "$SLUG" exec -T db pg_dump -U akdmi "akdmi_$SLUG" | gzip > "$OUT_DB"
ok "DB → $OUT_DB"

step "Archiving uploads"
tar -czf "$OUT_FILES" -C "$INSTANCES_DIR/$SLUG/data" uploads 2>/dev/null || warn "No uploads to archive"
[[ -f "$OUT_FILES" ]] && ok "Files → $OUT_FILES"

ok "Backup complete."
