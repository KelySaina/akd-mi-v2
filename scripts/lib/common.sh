#!/usr/bin/env bash
# Common helpers (colors, logging, validation)

# ── Colors ──
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    CYAN='\033[0;36m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' CYAN='' BLUE='' BOLD='' NC=''
fi

info()  { echo -e "${CYAN}ℹ${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*" >&2; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }
step()  { echo -e "\n${BOLD}${BLUE}▸ $*${NC}"; }

# ── Validation ──
validate_slug() {
    local s="$1"
    if [[ ! "$s" =~ ^[a-z][a-z0-9-]{1,30}[a-z0-9]$ ]]; then
        err "Invalid instance slug: '$s'"
        echo "  Must be 3-32 chars, lowercase letters/digits/hyphens, start with a letter."
        exit 1
    fi
}

require_instance_exists() {
    local slug="$1"
    if [[ ! -d "$INSTANCES_DIR/$slug" ]]; then
        err "Instance '$slug' does not exist."
        echo "  Run: akd-mi init $slug"
        exit 1
    fi
}

# ── Env file handling ──
load_instance_env() {
    local slug="$1"
    local env_file="$INSTANCES_DIR/$slug/.env"
    if [[ ! -f "$env_file" ]]; then
        err "Missing .env for instance '$slug'."
        exit 1
    fi
    # shellcheck disable=SC1090,SC2046
    set -a
    # Strip CRLF for safety
    eval "$(sed 's/\r$//' "$env_file" | grep -E '^[A-Z_][A-Z0-9_]*=' | sed 's/^/export /')"
    set +a
}

gen_random_secret() {
    local len="${1:-32}"
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex "$len"
    else
        head -c "$((len*2))" /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c "$((len*2))"
    fi
}

gen_random_password() {
    local len="${1:-20}"
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 32 | tr -d '/+=' | head -c "$len"
    else
        head -c 60 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c "$len"
    fi
}
