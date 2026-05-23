#!/usr/bin/env bash
set -euo pipefail

# Wait for DB to accept connections, then sync schema before starting Next.js.
# We use `prisma db push` because the portal does not ship migration files;
# the schema is the source of truth.

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] FATAL: DATABASE_URL is not set" >&2
  exit 1
fi

echo "[entrypoint] Waiting for database…"
# Parse host:port out of DATABASE_URL (postgresql://user:pw@host:port/db)
db_host_port="$(printf '%s' "$DATABASE_URL" | sed -E 's#^[a-z]+://[^@]*@([^/]+)/.*#\1#')"
db_host="${db_host_port%%:*}"
db_port="${db_host_port##*:}"
[ "$db_host" = "$db_port" ] && db_port=5432

for i in $(seq 1 60); do
  if (echo > "/dev/tcp/${db_host}/${db_port}") >/dev/null 2>&1; then
    echo "[entrypoint] Database reachable at ${db_host}:${db_port}"
    break
  fi
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "[entrypoint] FATAL: database not reachable at ${db_host}:${db_port}" >&2
    exit 1
  fi
done

echo "[entrypoint] Syncing Prisma schema (db push)…"
# Invoke the CLI via node so __dirname resolves correctly (the bin symlink
# would otherwise point at /app/node_modules/.bin and break .wasm lookups).
if [ -f ./node_modules/prisma/build/index.js ]; then
  node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss
else
  npx --yes prisma@6 db push --skip-generate --accept-data-loss
fi
echo "[entrypoint] Schema in sync."

echo "[entrypoint] Starting Next.js…"
exec node server.js
