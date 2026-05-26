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

# Host used in generated PUBLIC_*_URL values. Defaults to localhost for dev;
# set AKDMI_PUBLIC_HOST=<server-ip-or-domain> in the portal/runner environment
# to make new instances reachable from outside the host.
PUBLIC_HOST="${AKDMI_PUBLIC_HOST:-localhost}"
PUBLIC_SCHEME="${AKDMI_PUBLIC_SCHEME:-http}"

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
PUBLIC_WEB_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:$WEB_PORT
PUBLIC_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:$API_PORT

# ── Ports ──
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
S3_PUBLIC_ENDPOINT=$PUBLIC_SCHEME://$PUBLIC_HOST:$MINIO_PORT
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
echo "  3. Open:    $PUBLIC_SCHEME://$PUBLIC_HOST:$WEB_PORT"
