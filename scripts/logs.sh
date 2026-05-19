#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"
SLUG="$1"; shift || true
require_instance_exists "$SLUG"
compose_cmd "$SLUG" logs -f --tail=200 "$@"
