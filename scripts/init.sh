#!/usr/bin/env bash
# Create a new instance: directory, .env, ports, admin credentials.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/ports.sh"

SLUG="$1"
INSTANCE_DIR="$INSTANCES_DIR/$SLUG"

if [[ -d "$INSTANCE_DIR" ]]; then
    err "Instance '$SLUG' already exists at $INSTANCE_DIR"
    exit 1
fi

step "Initializing instance: $SLUG"

mkdir -p "$INSTANCE_DIR"/{data/postgres,data/redis,data/minio,data/uploads,backups}

OFFSET=$(allocate_offset)
WEB_PORT=$((WEB_BASE + OFFSET * 10))
API_PORT=$((API_BASE + OFFSET * 10))
DB_PORT=$((DB_BASE + OFFSET * 10))
REDIS_PORT=$((REDIS_BASE + OFFSET * 10))
MINIO_PORT=$((MINIO_BASE + OFFSET * 10))
MINIO_UI_PORT=$((MINIO_BASE + OFFSET * 10 + 1))

# Generate secrets and admin credentials
DB_PASSWORD=$(gen_random_password 24)
REDIS_PASSWORD=$(gen_random_password 24)
JWT_SECRET=$(gen_random_secret 32)
JWT_REFRESH_SECRET=$(gen_random_secret 32)
SESSION_SECRET=$(gen_random_secret 32)
MINIO_ROOT_USER="akdmi_$SLUG"
MINIO_ROOT_PASSWORD=$(gen_random_password 24)
ADMIN_EMAIL="admin@${SLUG}.local"
ADMIN_PASSWORD=$(gen_random_password 16)

# How this instance is reached from outside.
#
# Set AKDMI_BASE_DOMAIN in the portal/runner environment and the instance gets
# real hostnames behind the host's Caddy, with TLS:
#
#   AKDMI_BASE_DOMAIN=akd-mi.75-119-136-160.nip.io
#     -> https://<slug>.akd-mi.75-119-136-160.nip.io        web
#        https://api.<slug>.akd-mi.75-119-136-160.nip.io    api
#        https://media.<slug>.akd-mi.75-119-136-160.nip.io  public uploads
#
# Give it a label of its own (the `akd-mi.` above) rather than pointing it
# straight at the host's domain. Every slug becomes a hostname under it, and
# this box already serves other apps at the top level — timeline., izyah.,
# n8n., ollama. An instance slugged `n8n` would otherwise claim a name that is
# already taken, and Caddy would refuse the whole config with "ambiguous site
# definition", taking every other site down with it. Under a label, a slug can
# collide with nothing but another slug.
#
# Leave it unset and nothing changes for local work: localhost:<port> URLs, no
# proxy, no certificates. Either way every container port binds to BIND_HOST
# (127.0.0.1), so the only thing an unset base domain costs is public reachability
# — never an accidentally exposed database.
BASE_DOMAIN="${AKDMI_BASE_DOMAIN:-}"
BIND_HOST_VALUE="${AKDMI_BIND_HOST:-127.0.0.1}"

if [[ -n "$BASE_DOMAIN" ]]; then
    PUBLIC_SCHEME="${AKDMI_PUBLIC_SCHEME:-https}"
    WEB_HOST="${SLUG}.${BASE_DOMAIN}"
    API_HOST="api.${SLUG}.${BASE_DOMAIN}"
    MEDIA_HOST="media.${SLUG}.${BASE_DOMAIN}"
    PUBLIC_WEB_URL="$PUBLIC_SCHEME://$WEB_HOST"
    PUBLIC_API_URL="$PUBLIC_SCHEME://$API_HOST"
    S3_PUBLIC_ENDPOINT_VALUE="$PUBLIC_SCHEME://$MEDIA_HOST"
else
    # Legacy/dev: AKDMI_PUBLIC_HOST kept working as it did, host:port and no proxy.
    PUBLIC_HOST="${AKDMI_PUBLIC_HOST:-localhost}"
    PUBLIC_SCHEME="${AKDMI_PUBLIC_SCHEME:-http}"
    WEB_HOST=""
    API_HOST=""
    MEDIA_HOST=""
    PUBLIC_WEB_URL="$PUBLIC_SCHEME://$PUBLIC_HOST:$WEB_PORT"
    PUBLIC_API_URL="$PUBLIC_SCHEME://$PUBLIC_HOST:$API_PORT"
    S3_PUBLIC_ENDPOINT_VALUE="$PUBLIC_SCHEME://$PUBLIC_HOST:$MINIO_PORT"
fi

# Visual / branding category. Drives the theme (color palette, icon, hero copy)
# in the instance frontend. One of: SCHOOL, COLLEGE, HIGH_SCHOOL, UNIVERSITY,
# TRAINING_CENTER, VOCATIONAL, KINDERGARTEN, OTHER. Defaults to SCHOOL.
INSTANCE_CATEGORY_VALUE="${INSTANCE_CATEGORY:-SCHOOL}"

cat > "$INSTANCE_DIR/.env" <<EOF
# AKD-MI instance: $SLUG
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ)

# ── Identity ──
INSTANCE_SLUG=$SLUG
INSTANCE_NAME=$SLUG
INSTANCE_CATEGORY=$INSTANCE_CATEGORY_VALUE
PORT_OFFSET=$OFFSET

# ── Public URLs ──
PUBLIC_WEB_URL=$PUBLIC_WEB_URL
PUBLIC_API_URL=$PUBLIC_API_URL

# ── Public hostnames (empty = no proxy, localhost:PORT only) ──
# Consumed by scripts/caddy-site.sh to write this instance's site file.
WEB_HOST=$WEB_HOST
API_HOST=$API_HOST
MEDIA_HOST=$MEDIA_HOST

# ── Ports ──
# Interface the published ports bind to. 127.0.0.1 means the only way in is the
# proxy; anything else publishes this instance's database, cache and object store
# on that interface too.
BIND_HOST=$BIND_HOST_VALUE
WEB_PORT=$WEB_PORT
API_PORT=$API_PORT
DB_PORT=$DB_PORT
REDIS_PORT=$REDIS_PORT
MINIO_PORT=$MINIO_PORT
MINIO_UI_PORT=$MINIO_UI_PORT

# ── Database ──
DB_NAME=akdmi_$SLUG
DB_USER=akdmi
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://akdmi:$DB_PASSWORD@db:5432/akdmi_$SLUG?schema=public

# ── Redis ──
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379

# ── Auth ──
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
SESSION_SECRET=$SESSION_SECRET

# ── Storage (MinIO) ──
MINIO_ROOT_USER=$MINIO_ROOT_USER
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
S3_ENDPOINT=http://minio:9000
S3_PUBLIC_ENDPOINT=$S3_PUBLIC_ENDPOINT_VALUE
S3_REGION=us-east-1
S3_BUCKET=akdmi-$SLUG

# ── Email (Resend) ──
RESEND_API_KEY=
EMAIL_FROM=no-reply@$SLUG.local

# ── Initial admin (created on first \`akd-mi seed\`) ──
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=Administrator

# ── Runtime ──
NODE_ENV=production
LOG_LEVEL=info
EOF

# Copy override template
cp "$TEMPLATES_DIR/docker-compose.override.yml" "$INSTANCE_DIR/docker-compose.override.yml"

# Generate nginx config from template
if [[ -f "$TEMPLATES_DIR/nginx.conf.template" ]]; then
    sed "s|__SLUG__|$SLUG|g" "$TEMPLATES_DIR/nginx.conf.template" > "$INSTANCE_DIR/nginx.conf"
fi

ok "Instance directory created: $INSTANCE_DIR"
ok "Port window: web=$WEB_PORT api=$API_PORT db=$DB_PORT redis=$REDIS_PORT minio=$MINIO_PORT"
echo
echo -e "${BOLD}Initial admin credentials${NC} (saved in .env, also shown once here):"
echo "  Email:    $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo
info "Next steps:"
echo "  1. Review:  $INSTANCE_DIR/.env"
echo "  2. Start:   akd-mi up $SLUG"
if [[ -n "$BASE_DOMAIN" ]]; then
    echo "  3. Route:   sudo akd-mi caddy $SLUG --install"
    echo "  4. Open:    $PUBLIC_WEB_URL"
    echo
    info "Nothing answers at $WEB_HOST until step 3: the ports are on $BIND_HOST_VALUE."
else
    echo "  3. Open:    $PUBLIC_WEB_URL"
    echo
    info "Local-only: no base domain set, so no proxy and no certificates."
    echo "  Set AKDMI_BASE_DOMAIN=<domain> before 'init' to give an instance public hostnames."
fi
