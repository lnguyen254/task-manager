# Task Manager

A personal task and tag manager: register, log in, and manage your own tasks (status,
priority, due dates, tags) through a Next.js frontend backed by a NestJS API and
PostgreSQL.

## Prerequisites

- **Docker** and **Docker Compose** (the supported way to run the whole stack).
- **Node.js 22** and **pnpm 11** (only needed if you want to run an app locally outside
  Docker, e.g. for faster iteration on the frontend).

## Quick start (Docker Compose)

```bash
cp .env.example .env
# then edit .env and set real values for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
docker compose up --build
```

This brings up three services:

| Service    | URL                          |
| ---------- | ----------------------------- |
| `web`      | http://localhost:3001         |
| `api`      | http://localhost:3000         |
| `api` docs | http://localhost:3000/api/docs (Swagger) |
| `postgres` | localhost:5432                |

`api` waits for `postgres` to report healthy, applies pending Prisma migrations on
startup, and only then is considered healthy itself (via `GET /health`, which checks
real database connectivity); `web` in turn waits for `api` to be healthy before
starting. A first `docker compose up` from a clean clone/volume needs no extra setup
beyond the `.env` file above.

## Environment variables

All variables are documented with defaults/generation instructions in
[`.env.example`](.env.example) at the repo root — copy it to `.env` before running
`docker compose up`. In short:

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — Postgres credentials, also
  baked into the default `DATABASE_URL`.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — must be set to distinct random values
  (the `.env.example` comment shows how to generate one); the API refuses to boot
  without them.
- `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` — token lifetimes (default `15m`
  / `7d`).
- `CORS_ORIGIN` — the single origin the API accepts requests from (the `web` app).
- `API_INTERNAL_URL` — how `web`'s server-side BFF routes reach `api` inside the
  Docker network.

If you're running `apps/api` locally outside Docker, see
[`apps/api/.env.example`](apps/api/.env.example) instead (it points `DATABASE_URL` at
`localhost` rather than the `postgres` service name).

## Local development (without Docker)

```bash
pnpm install
docker compose up -d postgres   # just the database
pnpm --filter api dev           # http://localhost:3000
pnpm --filter web dev           # http://localhost:3001
```

Root-level scripts (`pnpm dev` / `build` / `lint` / `test`) run across every workspace
app via `pnpm -r`. Backend tests: `pnpm --filter api test` (unit) and
`pnpm --filter api test:e2e` (e2e — needs a reachable Postgres, e.g. the one from
`docker compose up -d postgres` above).

## Architecture

### Monorepo layout

A pnpm workspace (`pnpm-workspace.yaml`) with two apps under `apps/`:

- **`apps/api`** — NestJS + Prisma + PostgreSQL. Owns all business logic and data:
  auth, tasks, tags, all ownership-scoped per user.
- **`apps/web`** — Next.js (App Router). Renders the UI and hosts a Backend-for-Frontend
  (BFF) layer of Route Handlers under `src/app/api/*` that proxy to `apps/api`.

Each app has its own Dockerfile (multi-stage: build stage compiles the app and prunes
back to production dependencies; runtime stage runs as a non-root user).

### BFF proxy pattern

The browser never talks to `apps/api` directly and never handles a raw JWT. Instead:

1. `web`'s Route Handlers (`src/app/api/auth/*`, `src/app/api/tasks/*`,
   `src/app/api/tags/*`) call `apps/api` server-side, using `API_INTERNAL_URL`.
2. On login/register, the access and refresh tokens `apps/api` returns in its JSON
   response are set by `web` as `httpOnly` cookies on the browser — never exposed to
   client-side JavaScript.
3. Subsequent requests from the browser carry only that session cookie; the Route
   Handler reads it, attaches the access token as a `Bearer` header when calling
   `apps/api`, and silently refreshes-and-retries once on a `401` before giving up.

### Auth flow

- **Register** (`POST /auth/register`) hashes the password with argon2 and auto-logs
  the user in.
- **Login** (`POST /auth/login`) issues a short-lived access JWT (15m default) and a
  longer-lived refresh JWT (7d default); only a hash of the refresh token is stored,
  never the raw value.
- **Refresh** (`POST /auth/refresh`) rotates the refresh token on every use — reusing
  an already-rotated (or logged-out) refresh token is rejected.
- **Logout** (`POST /auth/logout`) invalidates the stored refresh token hash.
- Every protected route is guarded by a Passport JWT strategy and scopes all data
  access to the authenticated user's own records at the service layer.
