# Day 1 — Scaffold

Goal: a working monorepo skeleton with Postgres and the API container reachable through Docker, before any real feature code exists.

## Steps

1. Initialize the repo root and pnpm workspace.
   - Create `pnpm-workspace.yaml` declaring `apps/*`.
   - Create root `package.json` with shared scripts/tooling (formatting, linting) if desired.
2. Scaffold `apps/api` as a NestJS project.
   - Generate the app with the Nest CLI into `apps/api`.
   - Confirm it boots locally on its own port before touching Docker.
3. Scaffold `apps/web` as a Next.js project.
   - Generate with App Router, TypeScript, and Tailwind CSS enabled.
   - Confirm it boots locally on its own port.
4. Add Prisma to `apps/api`.
   - Install Prisma and initialize it pointing at a Postgres connection string via env var.
   - Add the schema defined in the design doc: `User`, `Task`, `Tag`, `TaskTag`, plus the `TaskStatus` and `TaskPriority` enums.
   - Generate the first migration from that schema.
5. Add a `/health` endpoint in the API (via `@nestjs/terminus` or a minimal handler) that at minimum confirms the process is up; DB connectivity check can be deepened on Day 7 when Terminus health wiring is finalized.
6. Write the root `docker-compose.yml` with two services to start: `postgres` (named volume for persistence, healthcheck) and `api` (depends on postgres being healthy, runs the Prisma migration on container start, exposes `/health`). Leave `web` out for now — it's wired in on Day 4.
7. Add `.env.example` (root and/or per-app) covering the Postgres connection string and any API env vars introduced so far.
8. Verify:
   - `docker compose up` brings up `postgres` and `api` cleanly.
   - `curl` (or browser) to the API's `/health` endpoint returns 200.
   - The Prisma migration has applied against the Dockerized Postgres (tables exist).
