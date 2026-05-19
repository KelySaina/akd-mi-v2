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

- [x] **Phase 1** — Orchestrator CLI + templates
- [ ] **Phase 2** — Backend API (auth, users, institution CRUD, storage)
- [ ] **Phase 3** — Frontend admin panel
- [ ] **Phase 4** — Academic modules (courses, students, teachers, grades, schedule)
- [ ] **Phase 5** — Central portal
- [ ] **Phase 6** — Polish (backups, monitoring, email, templates)
