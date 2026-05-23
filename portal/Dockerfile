# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# bash + docker CLI + compose plugin are needed at runtime because the admin
# routes shell out to the akd-mi script which is a bash program that drives
# `docker compose`. The docker socket is bind-mounted from the host (see
# docker-compose.yml) so we use the host's daemon — we don't run docker inside.
RUN apk add --no-cache bash docker-cli docker-cli-compose openssl
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
# Ship the full node_modules from the build stage so the Prisma CLI (and its
# transitive deps) are available at runtime for the entrypoint's `db push`.
# Next.js standalone already inlines what the server needs into ./node_modules,
# but we overwrite that with the complete tree (a superset).
COPY --from=build /app/node_modules ./node_modules
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
