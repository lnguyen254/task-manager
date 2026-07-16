# Personal Task Manager — Design & Implementation Plan

## Context

The user wants a personal task management website built and shippable within one week, using Next.js, NestJS, PostgreSQL, and Docker. Despite being a single-user personal tool, it should be built to production standards: secure auth, proper authorization, input validation, structured logging, containerized deployment, and a real test suite — not a prototype. The working directory (`d:\Workspace\project\task-manager`) is currently empty; this is a greenfield build.

Scope was narrowed through discussion to keep it achievable in a week:
- **Personal task CRUD + basics** (no projects/boards, no multi-user sharing)
- **Email + password auth** (JWT-based)
- **Local Docker only** for now — no live hosting/CI-to-prod required
- **Monorepo** with two apps
- **Next.js as a BFF proxy** in front of NestJS, using httpOnly cookies for the JWT (browser never talks to NestJS directly)
- **Backend unit + e2e tests; frontend tested manually** (no frontend automated tests this round)

## Architecture

**Monorepo** (pnpm workspaces): `apps/web` (Next.js, App Router), `apps/api` (NestJS), root `docker-compose.yml` running `postgres`, `api`, `web` as services.

- **ORM**: Prisma — type-safe queries, first-class migrations, clean NestJS integration.
- **Frontend ↔ Backend**: Next.js Route Handlers act as a BFF proxy. Login/register set an **httpOnly, secure, SameSite** cookie holding the JWT. Every other client request goes through a Next.js route handler that forwards to NestJS, attaching the cookie server-side. The browser never sees or stores the raw JWT — this avoids XSS token theft and simplifies CSRF posture (SameSite cookie + same-origin proxy).
- **UI**: Tailwind CSS + shadcn/ui for accessible, production-quality components without building a design system from scratch. Forms via react-hook-form + Zod.
- **Server state**: TanStack Query for caching/refetching/optimistic updates on task data.

## Data model (Prisma schema)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  tasks        Task[]
  tags         Tag[]
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags        TaskTag[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Tag {
  id     String    @id @default(uuid())
  name   String
  userId String
  user   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks  TaskTag[]

  @@unique([userId, name])
}

model TaskTag {
  taskId String
  tagId  String
  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
}
```

All queries are scoped by `userId` extracted from the verified JWT — no task or tag is ever readable or writable cross-user. This is enforced in the service layer, not just at the controller/route level, and covered by an explicit e2e test.

## API (NestJS, REST + Swagger/OpenAPI docs)

- `POST /auth/register` — create user, hash password (argon2)
- `POST /auth/login` — verify credentials, issue access + refresh JWT
- `POST /auth/refresh` — rotate refresh token, issue new access token
- `POST /auth/logout` — invalidate refresh token
- `GET /users/me` — current user profile
- `GET /tasks` — list with filter (status, priority, tag), search (title), sort, pagination
- `POST /tasks` — create
- `GET /tasks/:id` — detail
- `PATCH /tasks/:id` — update
- `DELETE /tasks/:id` — delete
- `GET /tags`, `POST /tags`, `DELETE /tags/:id`

## Security & production hardening

- Argon2 password hashing (not bcrypt — stronger against GPU cracking)
- Short-lived access JWT (~15 min) + longer-lived refresh JWT (~7 days), refresh token rotated on each use
- `class-validator` DTOs on every endpoint; global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- Helmet for security headers; `@nestjs/throttler` for rate limiting (especially on `/auth/*`)
- CORS locked to the Next.js app's origin only
- Global exception filter → consistent `{ statusCode, message, error }` JSON shape, no leaking stack traces in production
- Environment variable validation at boot (Zod) — fail fast on missing/malformed config; `.env` never committed, `.env.example` provided
- `@nestjs/terminus` `/health` endpoint wired into Docker healthchecks
- Structured logging via pino (request logs, no sensitive data logged)

## Testing

- **Backend unit tests** (Jest): `AuthService` (hashing, token issuance/verification, refresh rotation), `TasksService` (CRUD logic, authorization/ownership checks, filtering/sorting edge cases)
- **Backend e2e tests** (Supertest): register → login → refresh → logout flow; full task CRUD; explicit test that a second user cannot read/update/delete the first user's tasks or tags
- **Frontend**: no automated test suite this round — manual verification pass on day 6/7 covering the golden path and key edge cases (empty states, validation errors, expired session)

## Docker

- Multi-stage Dockerfiles for both `apps/api` and `apps/web` (build stage → slim non-root runtime image)
- `docker-compose.yml`:
  - `postgres`: named volume for persistence, healthcheck
  - `api`: depends on postgres being healthy, runs `prisma migrate deploy` on container start, exposes `/health`
  - `web`: depends on api
- `.env.example` at repo root and/or per-app
- README with prerequisites, setup, and run instructions (`docker compose up`)

## Day-by-day plan (7 days)

**Day 1 — Scaffold**
- `pnpm` workspace with `apps/web`, `apps/api`
- NestJS app init; Next.js app init (App Router, TypeScript, Tailwind)
- Prisma installed in `apps/api`, schema above, first migration
- `docker-compose.yml` with `postgres` + `api`; `/health` endpoint reachable through Docker
- Verify: `docker compose up` brings up Postgres + API, `curl` to `/health` returns 200

**Day 2 — Backend auth**
- `AuthModule`: register, login, refresh, logout
- Argon2 hashing, JWT strategy + guards (`AuthGuard`, `@CurrentUser()` decorator)
- Unit tests for `AuthService`, e2e tests for the full auth flow
- Verify: e2e suite green; manual `curl`/Postman flow works against the Dockerized API

**Day 3 — Backend tasks & tags**
- `TasksModule`, `TagsModule`: CRUD, DTOs, ownership-scoped queries
- Filtering/sorting/pagination on `GET /tasks`
- Unit tests for `TasksService`, e2e tests including cross-user access denial
- Verify: e2e suite green, Swagger docs render all endpoints correctly

**Day 4 — Frontend scaffold + auth wiring**
- Tailwind/shadcn setup, base layout
- Next.js Route Handlers as BFF proxy (`/api/auth/*` → NestJS, sets httpOnly cookie)
- Login/register pages, wired end-to-end against the Dockerized backend
- Verify: can register, log in, and land on an authenticated page with the session cookie set correctly

**Day 5 — Frontend tasks UI**
- Task list page (TanStack Query against BFF `/api/tasks`)
- Create/edit forms (react-hook-form + Zod) for title, description, status, priority, due date, tags
- Filtering/sorting UI, delete with confirmation
- Verify: full task CRUD works through the UI end-to-end

**Day 6 — Polish & hardening**
- Loading/error/empty states, toast notifications
- Responsive layout pass
- Security hardening pass: helmet, throttler, CORS config, env validation wired in
- Manual test pass against the golden path + edge cases (invalid input, expired session, empty task list)

**Day 7 — Production readiness & docs**
- Finalize multi-stage Dockerfiles (non-root user, slim images)
- Structured logging (pino) confirmed in container logs
- README: setup, run, environment variables, architecture overview
- Final full e2e test run; buffer time for any bug fixes found during manual pass

## Verification approach

- After each backend day: run `pnpm --filter api test` (unit) and `pnpm --filter api test:e2e` against a Dockerized Postgres
- After each frontend day: manually exercise the feature in the browser against `docker compose up`
- End of week: fresh `docker compose up` from a clean clone/volume, walk through register → login → create/edit/filter/delete tasks → logout, confirming no console errors and no cross-user data leakage
