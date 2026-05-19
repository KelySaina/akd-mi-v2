# AKD-MI Central Portal

Cross-instance discovery + global admin. Separate from per-institution stacks.

Holds:
- **Instance Registry** — list of all institution instances (slug, URL, status, owner)
- **Public Directory** — search across published institutions
- **Platform Admin** — provision/deprovision instances, monitor health

## Stack
- Next.js 15 (full-stack: pages + API routes)
- PostgreSQL (its own dedicated DB)
- Prisma

## Run

```bash
cd portal
cp .env.example .env
docker compose up -d
```
