# Day 7 — Production readiness & docs

Goal: the app is deployable from a clean clone, observable in production, and documented — plus buffer time to close out anything from Day 6.

## Steps

1. Finalize the multi-stage Dockerfiles for both `apps/api` and `apps/web`:
   - Build stage compiles the app; runtime stage is a slim image running as a non-root user.
   - Confirm image sizes are reasonable and no dev dependencies/build tooling leak into the runtime image.
2. Confirm structured logging via pino is active in the API and visible in container logs (request logs present, no sensitive data — passwords, tokens — ever logged).
3. Finalize `@nestjs/terminus` `/health` wiring into the Docker healthcheck for the `api` service (building on the basic health endpoint from Day 1).
4. Confirm `docker-compose.yml` is complete and correct end-to-end:
   - `postgres`: named volume, healthcheck.
   - `api`: waits on postgres healthy, runs `prisma migrate deploy` on start, exposes `/health`.
   - `web`: depends on `api`.
5. Write the README covering: prerequisites, setup steps, environment variables (referencing `.env.example`), how to run (`docker compose up`), and a brief architecture overview (monorepo layout, BFF proxy pattern, auth flow).
6. Do a final full backend e2e test run (`pnpm --filter api test:e2e`) against a fresh Dockerized Postgres.
7. Use any remaining buffer time to fix bugs surfaced during Day 6's manual pass or this day's final run.
8. Verify (end-of-week acceptance check):
   - Fresh `docker compose up` from a clean clone/volume (no leftover state).
   - Walk through register → login → create/edit/filter/delete tasks → logout in the browser.
   - Confirm no console errors and no cross-user data leakage during the walkthrough.
   - Confirm container logs show structured request logs with no sensitive data.
