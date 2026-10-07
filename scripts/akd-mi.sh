#!/usr/bin/env bash
# AKD-MI orchestrator CLI
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
INSTANCES_DIR="$PROJECT_DIR/instances"
TEMPLATES_DIR="$PROJECT_DIR/templates"
BACKUPS_DIR="$PROJECT_DIR/backups"
export PROJECT_DIR INSTANCES_DIR TEMPLATES_DIR BACKUPS_DIR

# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=lib/docker.sh
source "$SCRIPT_DIR/lib/docker.sh"
# shellcheck source=lib/ports.sh
source "$SCRIPT_DIR/lib/ports.sh"

usage() {
    cat <<EOF
${BOLD}akd-mi${NC} — Multi-instance institution platform orchestrator

${BOLD}Usage:${NC}
  akd-mi <command> [instance] [options]
  akd-mi <instance> <command> [options]    # ocompose-style positional order

${BOLD}Commands:${NC}
  ${GREEN}init${NC} <slug>           Create a new institution instance
  ${GREEN}up${NC} <slug>             Start the instance stack (builds if needed)
  ${GREEN}down${NC} <slug>           Stop the instance stack
  ${GREEN}restart${NC} <slug>        Restart the instance stack
  ${GREEN}destroy${NC} <slug>        Stop + remove containers, volumes, and instance dir
  ${GREEN}caddy${NC} <slug>           Render this instance's host-Caddy site blocks
                        (--install / --remove, both need sudo)
  ${GREEN}caddy-portal${NC}          Same, for the portal itself (reads portal/.env)
  ${GREEN}list${NC}                  Show all instances with status, ports, URLs
  ${GREEN}logs${NC} <slug> [svc]     Tail container logs
  ${GREEN}shell${NC} <slug> [svc]    Open a shell inside a service container (default: api)
  ${GREEN}exec${NC} <slug> <svc> ... Run an arbitrary command inside a service
  ${GREEN}migrate${NC} <slug>        Run database migrations
  ${GREEN}seed${NC} <slug>           Seed initial admin user + sample data
  ${GREEN}backup${NC} <slug>         Backup the instance database + uploads
  ${GREEN}restore${NC} <slug> <file> Restore from a backup archive
  ${GREEN}status${NC} <slug>         Show container status for one instance
  ${GREEN}help${NC}                  Show this help

${BOLD}Examples:${NC}
  akd-mi init paris-tech
  akd-mi up paris-tech
  akd-mi paris-tech up         # same thing, positional swap
  akd-mi list
EOF
}

# Parse args supporting both orderings:
#   akd-mi <cmd> <slug>
#   akd-mi <slug> <cmd>
parse_args() {
    if [[ $# -eq 0 ]]; then
        usage
        exit 0
    fi

    local first="$1"; shift || true
    local second="${1:-}"; [[ $# -gt 0 ]] && shift || true

    local known_cmds="init up down restart destroy list logs shell exec migrate seed backup restore status help"

    # First token is a command?
    if [[ " $known_cmds " == *" $first "* ]]; then
        CMD="$first"
        INSTANCE="${second:-}"
    elif [[ " $known_cmds " == *" $second "* ]]; then
        # slug first, command second
        INSTANCE="$first"
        CMD="$second"
    else
        # Single arg: assume it's a command (e.g., list, help)
        CMD="$first"
        INSTANCE="${second:-}"
    fi

    ARGS=("$@")
}

CMD=""
INSTANCE=""
ARGS=()
parse_args "$@"

# Dispatch
case "$CMD" in
    help|-h|--help|"") usage; exit 0 ;;
    list)              exec bash "$SCRIPT_DIR/list.sh" ;;
    caddy-portal)      exec bash "$SCRIPT_DIR/caddy-site.sh" --portal "${@:2}" ;;
esac

# All other commands require an instance name
if [[ -z "$INSTANCE" ]]; then
    err "Command '$CMD' requires an instance name."
    echo "  Usage: akd-mi $CMD <slug>"
    exit 1
fi

validate_slug "$INSTANCE"
export INSTANCE PROJECT_DIR INSTANCES_DIR TEMPLATES_DIR BACKUPS_DIR

case "$CMD" in
    init)     exec bash "$SCRIPT_DIR/init.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    up)       exec bash "$SCRIPT_DIR/up.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    down)     exec bash "$SCRIPT_DIR/down.sh" "$INSTANCE" ;;
    restart)  bash "$SCRIPT_DIR/down.sh" "$INSTANCE" || true
              exec bash "$SCRIPT_DIR/up.sh" "$INSTANCE" ;;
    destroy)  exec bash "$SCRIPT_DIR/destroy.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    caddy)    exec bash "$SCRIPT_DIR/caddy-site.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    logs)     exec bash "$SCRIPT_DIR/logs.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    shell)    exec bash "$SCRIPT_DIR/shell.sh" "$INSTANCE" "${ARGS[@]:-api}" ;;
    exec)     exec bash "$SCRIPT_DIR/exec.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    migrate)  exec bash "$SCRIPT_DIR/migrate.sh" "$INSTANCE" ;;
    seed)     exec bash "$SCRIPT_DIR/seed.sh" "$INSTANCE" ;;
    backup)   exec bash "$SCRIPT_DIR/backup.sh" "$INSTANCE" ;;
    restore)  exec bash "$SCRIPT_DIR/restore.sh" "$INSTANCE" "${ARGS[@]:-}" ;;
    status)   exec bash "$SCRIPT_DIR/status.sh" "$INSTANCE" ;;
    *)
        err "Unknown command: $CMD"
        usage
        exit 1
        ;;
esac
