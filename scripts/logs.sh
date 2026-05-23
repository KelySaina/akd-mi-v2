#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"
SLUG="$1"; shift || true
require_instance_exists "$SLUG"

# Default: follow last 200 lines. Pass --no-follow to disable -f (useful for the portal).
FOLLOW="-f"
TAIL="--tail=200"
ARGS=()
for a in "$@"; do
    case "$a" in
        --no-follow) FOLLOW="" ;;
        --tail=*)    TAIL="$a" ;;
        *)           ARGS+=("$a") ;;
    esac
done

compose_cmd "$SLUG" logs $FOLLOW "$TAIL" "${ARGS[@]:-}"
