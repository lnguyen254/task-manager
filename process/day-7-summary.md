# Day 7 — Production readiness & docs: Summary

Status: Complete. Steps 1–6 from `plans/day-7-production-readiness-docs.md` executed and
verified. Step 7 (buffer time) was absorbed by a real bug caught and fixed during step 3's
own verification (see "Notable issues" below). Step 8's API/curl-level acceptance checks
all pass; its two browser-only checks (no console errors, a final visual cross-user pass)
remain unverified — no browser tooling was available in this session, carrying forward the
same open item flagged at the end of Day 6.

## What was done

1. **`@nestjs/terminus` health check + Docker healthcheck (plan step 3, done first).**
   `GET /health` now runs a real Prisma connectivity check via Terminus's built-in
   `PrismaHealthIndicator` (confirmed via the installed package's own source rather than
   assumed — some search results incorrectly claimed Terminus has no Prisma support).
   Test-first: an e2e test asserting `res.body.info.database.status === 'up'` was written
   and watched fail against the old `{status:'ok'}` stub before implementing. The API
   Dockerfile gained a `HEALTHCHECK` (`node -e "fetch('http://localhost:3000/health')..."`,
   no curl/wget needed in the alpine image) — verified live by stopping/restarting the
   `postgres` container and watching `docker inspect`'s health status flip
   `healthy → unhealthy → healthy`.

2. **Hardened, non-root, slim Dockerfiles (plan step 1).** Both `apps/api/Dockerfile` and
   `apps/web/Dockerfile` now run `pnpm prune --prod` after building and switch to the
   `node` user (built into `node:22-alpine`) for the runtime stage, with `--chown=node:node`
   on every `COPY`. `prisma` (the CLI) was moved from `devDependencies` to `dependencies` in
   `apps/api/package.json`, since the container's `CMD` runs `prisma migrate deploy` at
   startup — pruning would otherwise have deleted the one devDependency actually needed at
   runtime. Confirmed live: no dev tooling (jest/eslint/typescript/tailwind/...) present in
   either image, `prisma --version` still works inside the pruned api image, both containers
   run as `node`, and a full register → session → create-task flow works end-to-end through
   the hardened images.

3. **Structured pino logging (plan step 2).** Wired `nestjs-pino` as Nest's logger
   (`app.useLogger` + `bufferLogs: true`), so `docker logs api` now emits structured JSON
   request logs (method/url/statusCode/responseTime) instead of the default text logger.
   `req.headers.authorization`, `req.headers.cookie`, and `res.headers["set-cookie"]` are
   redacted — verified live by hitting a protected route with a real Bearer token and cookie
   and confirming both show `[Redacted]` in the output. `/health` is excluded from the
   request log (the Docker healthcheck polls it every 10s and would otherwise bury real
   traffic), and the log level is silenced under `NODE_ENV=test` to keep test output clean.

4. **`docker-compose.yml` end-to-end (plan step 4).** One real gap closed: `web`'s
   `depends_on: api` was upgraded to `condition: service_healthy`, now that `api` has a
   meaningful healthcheck from step 3 — previously `web` could start racing `api`'s
   migration/boot window. Verified from a genuinely clean state (`docker compose down -v`
   removing the named volume, then `docker compose up -d --build`): both fresh migrations
   applied on the empty database, Compose's own startup ordering correctly blocked `web`
   until `api` reported healthy, and a golden-path curl walkthrough through `web` succeeded
   immediately after.

5. **Root `README.md` (plan step 5, previously missing entirely).** Prerequisites, a
   `docker compose up` quick start with a service/URL table, an environment-variable summary
   that points to `.env.example` / `apps/api/.env.example` rather than duplicating them, a
   local (non-Docker) dev section, and an architecture overview (monorepo layout, the BFF
   proxy pattern, the auth flow). The BFF route-handler paths cited in it
   (`apps/web/src/app/api/{auth,tasks,tags}/*`) were confirmed against the actual file tree
   rather than assumed from memory of earlier days' summaries.

6. **Final backend e2e run against a fresh Dockerized Postgres (plan step 6).** Tore the
   stack down including the volume, brought up a fresh `postgres` + `api` (migrations
   applied on that empty database), then ran the plan's exact command,
   `pnpm --filter api test:e2e`: 22/22 e2e tests passing across 4 suites. Also ran
   `pnpm --filter api test` for the full picture: 105/105 unit tests passing. `tsc --noEmit`
   and `eslint` clean on every file touched this session.

## Notable issues hit and resolved along the way

- **A real bug in `AllExceptionsFilter`, caught by the same kind of manual curl
  verification that caught a bug on Day 6.** The filter's `ErrorBody` type declares
  `error: string`, but an unsafe cast let a non-`HttpException`-shaped failure — Terminus's
  `ServiceUnavailableException`, whose `error` field is a per-indicator details *object*, not
  a string — leak that raw object straight into the response, silently violating the filter's
  own contract. Reproduced live by stopping Postgres and curling `/health`
  (`"error":{"database":{"status":"down",...}}` instead of a string), then written as a
  failing unit test first (`ServiceUnavailableException` with a Terminus-shaped body) before
  fixing the filter to fall back to the standard reason phrase whenever `error`/`message`
  aren't actually the type the response contract promises.
- **`pnpm prune` doesn't take a `--filter` flag.** Passing `--filter api...` (which works
  fine for `pnpm install`) failed with `Unknown option: 'recursive'`. More importantly,
  running plain `pnpm prune --prod` from the *repo root* silently deleted every top-level
  `node_modules` symlink — not just devDependencies — because the root `package.json` has no
  dependencies of its own, so pnpm treated "what the root needs" (nothing) as the pruning
  target. Confirmed by testing (an empty `node_modules` after the "successful" prune) rather
  than assuming the command did what its name suggested. Fixed by running `pnpm prune --prod`
  from *inside* each app's own directory, where pnpm correctly scopes it to that package's
  real dependency graph.
- **`pnpm prune` needs `CI=true` in Docker.** Without it, `RUN pnpm prune --prod` fails with
  `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` — pnpm's interactive confirmation prompt has no
  TTY to answer inside a `docker build`. Added `ENV CI=true` to both Dockerfiles' base stage.
- **`pnpm deploy` (the more "idiomatic" pnpm-workspace approach to a prod-only Docker image)
  was tried first and abandoned.** It requires `--legacy` or `inject-workspace-packages=true`
  to run at all in this workspace, and even then it silently omitted `apps/api/src/generated`
  from the deployed output — respecting that package's own `.gitignore`
  (`/src/generated/prisma`), which would have shipped an image with no Prisma client and
  broken at runtime. Confirmed by actually running `pnpm deploy` locally and inspecting the
  output directory before committing to the approach, not by trusting the command's
  reputation as "the right way." Switched to `pnpm prune --prod` instead, which only ever
  touches `node_modules` and isn't affected by either app's `.gitignore`.

## End state

All six executable Day 7 plan steps are done and verified: `/health` performs a real,
Terminus-backed database check wired into a working Docker `HEALTHCHECK`; both runtime
images are non-root and free of dev tooling; the API emits structured, secret-redacted JSON
logs to stdout; `docker-compose.yml` brings up a fully health-gated `postgres → api → web`
chain from a completely clean volume; the root `README.md` documents setup, environment
variables, and architecture; and 105 unit + 22 e2e tests pass against a freshly migrated
Dockerized Postgres. Two items carry forward as open, both requiring actual browser tooling
neither this session nor Day 6's had available: confirming zero browser console errors during
a full walkthrough, and a final visual (not just e2e-test) cross-user-isolation check.
