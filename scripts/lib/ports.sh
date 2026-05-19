#!/usr/bin/env bash
# Port allocation helpers
# Each instance gets a 10-port window starting at BASE.
# Instance N (0-indexed) uses: WEB=3100+N*10, API=4100+N*10, DB=5100+N*10,
#                              REDIS=6100+N*10, MINIO=7100+N*10, MINIO_UI=7101+N*10

WEB_BASE=3100
API_BASE=4100
DB_BASE=5100
REDIS_BASE=6100
MINIO_BASE=7100

count_instances() {
    local n=0
    if [[ -d "$INSTANCES_DIR" ]]; then
        for d in "$INSTANCES_DIR"/*/; do
            [[ -d "$d" ]] && n=$((n+1))
        done
    fi
    echo "$n"
}

# Allocate the next available offset (multiple of 10) by checking existing .env files.
next_port_offset() {
    local max=-1
    if [[ -d "$INSTANCES_DIR" ]]; then
        for env in "$INSTANCES_DIR"/*/.env; do
            [[ -f "$env" ]] || continue
            local off
            off=$(grep -E '^PORT_OFFSET=' "$env" 2>/dev/null | head -1 | cut -d= -f2 | tr -d '[:space:]')
            if [[ "$off" =~ ^[0-9]+$ ]] && (( off > max )); then
                max=$off
            fi
        done
    fi
    echo $(( (max + 1) * 10 / 10 + 0 ))  # next slot, simple +1
}

# Simpler: just return max+1
allocate_offset() {
    local max=-1
    if [[ -d "$INSTANCES_DIR" ]]; then
        for env in "$INSTANCES_DIR"/*/.env; do
            [[ -f "$env" ]] || continue
            local off
            off=$(grep -E '^PORT_OFFSET=' "$env" 2>/dev/null | head -1 | cut -d= -f2 | tr -d '[:space:]')
            if [[ "$off" =~ ^[0-9]+$ ]] && (( off > max )); then
                max=$off
            fi
        done
    fi
    echo $(( max + 1 ))
}
