#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"
SLUG="$1"; SVC="${2:-api}"
require_instance_exists "$SLUG"
# Pick a default shell per service
case "$SVC" in
    db)    compose_cmd "$SLUG" exec "$SVC" psql -U akdmi -d "akdmi_$SLUG" ;;
    redis) compose_cmd "$SLUG" exec "$SVC" redis-cli ;;
    *)     compose_cmd "$SLUG" exec "$SVC" sh -c 'command -v bash >/dev/null && exec bash || exec sh' ;;
esac
