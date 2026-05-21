#!/usr/bin/env bash
# Docker / docker compose wrapper (WSL-aware)

USE_WSL="false"
# Check for a real `docker` binary (not a shell function from a previous source).
if ! type -P docker >/dev/null 2>&1; then
    if command -v wsl >/dev/null 2>&1 || command -v wsl.exe >/dev/null 2>&1; then
        USE_WSL="true"
    fi
fi

if [[ "$USE_WSL" == "true" ]]; then
    docker() { MSYS_NO_PATHCONV=1 wsl docker "$@"; }
    export -f docker 2>/dev/null || true
fi

# Convert a Git-Bash/MINGW path to a WSL /mnt/<drive>/... path.
to_wsl_path() {
    local p="$1"
    if [[ "$p" =~ ^/([a-zA-Z])/ ]]; then
        echo "/mnt/${BASH_REMATCH[1],,}${p:2}"
    elif [[ "$p" =~ ^([A-Za-z]):[\\/] ]]; then
        local drive="${p:0:1}"
        echo "/mnt/${drive,,}${p:2}" | sed 's|\\|/|g'
    else
        echo "$p"
    fi
}

docker_path() {
    if [[ "$USE_WSL" == "true" ]]; then
        to_wsl_path "$1"
    else
        echo "$1"
    fi
}

# Build a `docker compose` invocation scoped to one instance.
# Usage: compose_cmd <slug> <compose-args...>
compose_cmd() {
    local slug="$1"; shift
    local instance_dir="$INSTANCES_DIR/$slug"
    local env_file="$instance_dir/.env"
    local base_compose="$TEMPLATES_DIR/docker-compose.yml"
    local override="$instance_dir/docker-compose.override.yml"

    local files=(-f "$(docker_path "$base_compose")")
    [[ -f "$override" ]] && files+=(-f "$(docker_path "$override")")

    # IMPORTANT: docker compose lets shell env vars SHADOW values in --env-file.
    # The portal container has its own JWT_SECRET, DATABASE_URL, etc. — if we
    # don't unset them here, those leak into the instance and break per-instance
    # config (e.g. zod env validation in the api fails with the portal's short
    # JWT secret). Unset every var that the instance .env defines on its own.
    (
        unset JWT_SECRET JWT_REFRESH_SECRET SESSION_SECRET \
              DATABASE_URL REDIS_URL REDIS_PASSWORD \
              DB_NAME DB_USER DB_PASSWORD DB_PORT \
              MINIO_ROOT_USER MINIO_ROOT_PASSWORD \
              S3_ENDPOINT S3_PUBLIC_ENDPOINT S3_REGION S3_BUCKET S3_ACCESS_KEY S3_SECRET_KEY \
              ADMIN_EMAIL ADMIN_PASSWORD ADMIN_NAME \
              INSTANCE_SLUG INSTANCE_NAME PUBLIC_WEB_URL PUBLIC_API_URL \
              WEB_PORT API_PORT MINIO_PORT MINIO_UI_PORT PORT_OFFSET \
              NODE_ENV LOG_LEVEL JWT_ACCESS_TTL JWT_REFRESH_TTL \
              RESEND_API_KEY EMAIL_FROM
        docker compose \
            -p "akdmi-$slug" \
            --env-file "$(docker_path "$env_file")" \
            --project-directory "$(docker_path "$PROJECT_DIR")" \
            "${files[@]}" \
            "$@"
    )
}

container_name() {
    local slug="$1" svc="$2"
    echo "akdmi-${slug}-${svc}-1"
}
