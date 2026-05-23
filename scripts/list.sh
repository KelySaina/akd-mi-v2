#!/usr/bin/env bash
# List all instances with status and ports.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/docker.sh"

if [[ ! -d "$INSTANCES_DIR" ]] || [[ -z "$(ls -A "$INSTANCES_DIR" 2>/dev/null | grep -v '^.gitkeep$' || true)" ]]; then
    info "No instances yet. Run: akd-mi init <slug>"
    exit 0
fi

printf "${BOLD}%-20s %-10s %-8s %-8s %-8s${NC}\n" "SLUG" "STATUS" "WEB" "API" "DB"
printf "${BOLD}%-20s %-10s %-8s %-8s %-8s${NC}\n" "────" "──────" "───" "───" "──"

for dir in "$INSTANCES_DIR"/*/; do
    [[ -d "$dir" ]] || continue
    slug="$(basename "$dir")"
    [[ "$slug" == ".gitkeep" ]] && continue
    env_file="$dir/.env"
    [[ -f "$env_file" ]] || continue

    web_port=$(grep -E '^WEB_PORT=' "$env_file" | cut -d= -f2 | tr -d '[:space:]')
    api_port=$(grep -E '^API_PORT=' "$env_file" | cut -d= -f2 | tr -d '[:space:]')
    db_port=$(grep -E '^DB_PORT=' "$env_file" | cut -d= -f2 | tr -d '[:space:]')

    # Check if any container for this project is running
    running=$(docker ps --filter "label=com.docker.compose.project=akdmi-$slug" --format '{{.ID}}' 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$running" -gt 0 ]]; then
        status="${GREEN}running${NC}"
    else
        status="${YELLOW}stopped${NC}"
    fi

    printf "%-20s %-19b %-8s %-8s %-8s\n" "$slug" "$status" "$web_port" "$api_port" "$db_port"
done
