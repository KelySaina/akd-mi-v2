#!/usr/bin/env bash
# Destroy: stop containers, remove volumes, delete instance directory.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"

SLUG="$1"
shift || true

# Non-interactive escape hatches:
#   akd-mi destroy <slug> --yes        (or -y / --force)
#   AKDMI_AUTO_CONFIRM=1 akd-mi destroy <slug>
# Required when the portal spawns this script without a TTY.
AUTO_CONFIRM="${AKDMI_AUTO_CONFIRM:-0}"
for arg in "$@"; do
    case "$arg" in
        -y|--yes|--force) AUTO_CONFIRM=1 ;;
    esac
done

require_instance_exists "$SLUG"

warn "This will PERMANENTLY DELETE instance '$SLUG':"
echo "  - All containers"
echo "  - All volumes (database, uploads, etc.)"
echo "  - Instance directory: $INSTANCES_DIR/$SLUG"

if [[ "$AUTO_CONFIRM" == "1" ]]; then
    info "Auto-confirm enabled (--yes or AKDMI_AUTO_CONFIRM=1)."
else
    read -r -p "Type the slug '$SLUG' to confirm: " confirm
    if [[ "$confirm" != "$SLUG" ]]; then
        err "Aborted."
        exit 1
    fi
fi

step "Stopping and removing containers + volumes"
compose_cmd "$SLUG" down -v --remove-orphans || true

step "Deleting instance directory"
rm -rf "$INSTANCES_DIR/$SLUG"

ok "Instance '$SLUG' destroyed."
