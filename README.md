# AKD-MI-V2

**Multi-instance educational institution management platform.**

Each institution gets its own isolated full-stack deployment (database, API,
frontend), managed by a single orchestrator CLI — similar to how `ocompose`
manages per-project dev environments.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Central Portal (separate deployment)                           │
│  - Public directory of published institutions                   │
│  - Platform-wide admin                                          │
│  - Instance registry                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ registers/discovers
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Orchestrator CLI (akd-mi)                                      │
│  - init / up / down / destroy / list / backup / restore         │
└────┬────────────────────┬────────────────────┬─────────────────┘
     │                    │                    │
     ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Institut │         │ Institut │   ...   │ Institut │
│ Instance │         │ Instance │         │ Instance │
│          │         │          │         │          │
│ web+api  │         │ web+api  │         │ web+api  │
│ +db+s3   │         │ +db+s3   │         │ +db+s3   │
└──────────┘         └──────────┘         └──────────┘
```

## Stack per instance

| Service | Tech                            |
|---------|---------------------------------|
| `api`   | Node.js + Fastify + Prisma      |
| `db`    | PostgreSQL 16                   |
| `web`   | Next.js 15 (admin + public)     |
| `nginx` | Reverse proxy + SSL termination |
| `redis` | Sessions & caching              |
| `minio` | S3-compatible storage (uploads) |

## Roles

| Role             | Scope               |
|------------------|---------------------|
| `instance_admin` | Full instance       |
| `manager`        | Operational         |
| `teacher`        | Own courses/grades  |
| `student`        | Own data (read)     |

## Quick start

```bash
# Initialize a new institution instance
./akd-mi init paris-tech

# Start it
./akd-mi up paris-tech

# View admin panel
# → http://localhost:<auto-assigned-port>/admin

# List all instances
./akd-mi list

# Stop / restart
./akd-mi down paris-tech
./akd-mi restart paris-tech

# Tail logs
./akd-mi logs paris-tech [service]

# Shell into a service
./akd-mi shell paris-tech api

# Backup / restore
./akd-mi backup paris-tech
./akd-mi restore paris-tech <backup-file>

# Destroy (removes everything including data!)
./akd-mi destroy paris-tech
```

## Repository layout

```
akd-mi-v2/
├── akd-mi                       # bash CLI entrypoint
├── akd-mi.cmd                   # Windows wrapper
├── scripts/
│   ├── akd-mi.sh                # main CLI logic
│   ├── lib/                     # helpers (env, ports, docker)
│   ├── init.sh
│   ├── up.sh
│   ├── down.sh
│   ├── destroy.sh
│   ├── list.sh
│   ├── backup.sh
│   └── restore.sh
├── templates/
│   ├── docker-compose.yml       # base stack
│   ├── .env.example
│   ├── nginx.conf.template
│   └── docker-compose.override.yml
├── instances/                   # one folder per institution (gitignored)
│   └── <slug>/
│       ├── .env
│       ├── docker-compose.override.yml
│       ├── nginx.conf
│       └── data/                # volumes mount here
├── backend/                     # API source (built into image)
├── frontend/                    # Web source (built into image)
├── portal/                      # Central portal (separate deployment)
└── docs/
```

## Phases

- [x] **Phase 1** — Orchestrator CLI + templates (`init`, `up`, `down`, `destroy`, `list`,
  `backup`, `restore`, `logs`, `shell`, `migrate`, `seed`, auto port allocation, per-instance
  `.env`, generated `docker-compose.override.yml` and `nginx.conf`).
- [x] **Phase 2** — Backend API (Fastify + Prisma): auth (login/logout, password reset),
  users, institutions, courses, modules, enrollments, teachers, students, grades,
  assessments, notifications, S3/MinIO-backed storage, hardened CORS.
- [x] **Phase 3** — Frontend admin panel (Next.js 15): role-aware sidebar with collapsible
  groups and persisted state, topbar with logout, structured forms, self-profile,
  media picker, course media manager, mobile-friendly shell.
- [x] **Phase 4** — Academic modules: courses, students, teachers, grades, schedule,
  assessments, teacher gradebook with per-student assessment overview.
- [x] **Phase 5** — Central portal (separate Next.js 15 + Postgres deployment):
  - Admin portal for managing instances (create, import existing, start/stop, status).
  - Job runner with detail pages, status tracking and cancellation handling.
  - Public directory (`DirectoryClient`) with search and filtering by category.
  - Category management API and integration into instance forms.
  - Landing pages per category (Tech, Music, Salon, Sports) plus Corporate, Editorial,
    Vibrant and Modern landing variants.
  - Student self-registration with admin approval flow.
  - `PublicLink` / `resolvePublicUrl` so instance URLs resolve correctly across
    host, container and reverse-proxy contexts.
  - Bearer-token-gated `/admin` and `/api/admin/*` with `Secure` cookie when served
    over HTTPS.
- [x] **Phase 6 (in progress)** — Ops & polish:
  - Dockerised portal with bind-mounted docker socket so it can drive `akd-mi` on
    the host.
  - `docker-entrypoint.sh` waits for the DB and runs `prisma db push` on every boot
    (portal has no migration files; schema is the source of truth).
  - Improved migration logic in `migrate.sh` / `up.sh` (handles missing
    `prisma/migrations` folder, pins Prisma CLI version, `--accept-data-loss` guard).
  - GitHub Actions CI: Node setup, backend + frontend builds, portal deployment
    workflow.
  - `.gitattributes` enforcing LF line endings for shell scripts.
  - rsync exclude hardening for `instances/` during deploy/backup.
- [ ] **Phase 7** — Remaining polish: automated backup scheduling, monitoring, email,
  pre-built instance templates.

---

## What's new since the initial spec

The codebase has grown beyond the original outline. Highlights pulled from the commit
history:

### Orchestrator (`scripts/`)
- `import` flow for adopting already-running instances into the registry
  (`feat: implement import functionality for existing instances`).
- Robust `up`/`migrate` paths that no-op gracefully when there are no Prisma
  migration files and fall back to `db push`.
- `rsync` exclusions for `instances/` to prevent permission errors and accidental
  data deletion during sync/deploy.
- `akd-mi.sh` exports project directories so child processes (portal, jobs) inherit
  the right paths.

### Central portal (`portal/`)
- Full admin shell (`AdminShell`, `Dialogs`, `JobRunner`, `DirectoryClient`,
  `PublicLink`) with bearer-token auth (`admin-auth.ts`).
- Prisma models: `PortalUser`, `Instance`, `AuditLog`, `Category`.
- Public-facing directory with category filtering and per-category landing pages.
- API routes under `src/app/api/admin/*` for instances, jobs, categories, import.
- Containerised deployment (`portal/docker-compose.yml`, `portal/Dockerfile`,
  `portal/docker-entrypoint.sh`) that mounts the host docker socket and the
  `akd-mi-v2` project at the same absolute path so spawned `akd-mi up <slug>`
  commands resolve identically inside and outside the container.

### Backend (`backend/`)
- Modules: `auth`, `users`, `institutions`, `courses`, `modules`, `enrollments`,
  `teachers`, `students`, `grades`, `assessments`, `notifications`,
  `password-resets`, `storage`.
- Hardened CORS, S3/MinIO presigned uploads, Redis-backed sessions.

### Frontend (`frontend/`)
- Role-aware sidebar with collapsible, persisted groups.
- Teacher gradebook, course media manager, media picker, self-profile.
- Mobile sidebar shell and viewport-fit form controls.

### Quick start — central portal

```bash
cd portal
cp .env.example .env                  # then fill in secrets
docker compose up -d --build          # entrypoint runs `prisma db push` then starts Next.js
# → http://localhost:3099/admin       (gated by PORTAL_ADMIN_TOKEN)
```

The portal needs three secrets in `portal/.env`: `JWT_SECRET`, `PORTAL_DB_PASSWORD`,
`PORTAL_ADMIN_TOKEN` (generate each with `openssl rand -hex 32`), plus
`AKDMI_PROJECT_DIR` pointing at this repo's absolute path on the host.
