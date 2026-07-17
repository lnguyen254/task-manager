# Day 2 — Backend auth: Summary

Status: Complete. Steps 1–7 and 10 from `plans/day-2-backend-auth.md` executed and verified. Steps 8–9 (writing a dedicated unit/e2e test pass) were skipped by request — in practice the unit test coverage they called for already existed, since every service/strategy/DTO in steps 1–7 was built test-first (TDD) rather than tested after the fact.

## What was done

1. **AuthModule scaffolded on a Prisma-backed UsersService.** Added `PrismaModule`/`PrismaService` (using the `@prisma/adapter-pg` driver adapter, which Prisma 7's client now requires instead of a plain connection string), a `UsersService` (`findByEmail`/`findById`/`create`), and an `AuthModule` shell wired into `AppModule`.

2. **Registration implemented.** `POST /auth/register` validates input with a `class-validator` DTO (email, password ≥ 8 characters, name), hashes the password with argon2, and rejects duplicate emails with a 409. Added the global `ValidationPipe` (whitelist/forbidNonWhitelisted/transform) needed for the DTO decorators to actually be enforced.

3. **Login implemented.** `POST /auth/login` verifies credentials against the argon2 hash (using the same generic error message for "unknown email" and "wrong password" so the endpoint doesn't reveal which emails are registered), then issues a short-lived access JWT (15 min) and a longer-lived refresh JWT (7 days), each signed with its own secret. Only a SHA-256 hash of the refresh token is persisted on the user record, never the raw token.

4. **Refresh implemented with rotation.** `POST /auth/refresh` verifies the incoming token against the refresh secret, then rejects it unless its hash matches what's stored. On success it issues a brand-new access+refresh pair and overwrites the stored hash, which invalidates the old refresh token — reusing it afterward now fails instead of silently working.

5. **Logout implemented.** `POST /auth/logout` verifies the presented refresh token the same way refresh does, then clears the stored hash so it can no longer be used to mint new tokens.

6. **JWT strategy and guards added.** Added the Passport JWT strategy that verifies the access token and loads the corresponding user (returning only safe profile fields, never the password or refresh-token hashes), a reusable `AuthGuard`, and a `@CurrentUser()` decorator for pulling the verified user off the request in protected route handlers.

7. **First protected endpoint wired up.** `GET /users/me` now sits behind the guard and returns the current user's profile, completing the full authentication flow end-to-end.

10. **Full verification pass.** Ran the complete flow (register → login → `/users/me` → refresh → logout) against a freshly-provisioned Dockerized stack (fresh volume, fresh containers), plus the explicit failure cases called out in the plan: wrong password, missing/invalid access token, and reuse of an already-rotated or already-logged-out refresh token.

## Notable issues hit and resolved along the way

- **Prisma 7's client is driver-adapter-only.** The previously-working `PrismaClient()` constructor call started failing because Prisma 7 no longer accepts a plain connection string — it requires an explicit driver adapter (`@prisma/adapter-pg`) instead.
- **Generated Prisma client had to move under `src/`.** Because the client is now generated as TypeScript that gets pulled into the compile via imports, having it live outside `src/` widened `tsc`'s inferred build root, which silently changed the compiled output path and broke the Dockerfile's start command. Moving the generated output under `src/generated` fixed it.
- **Jest and e2e config didn't understand the generated client's import style.** The generated client uses `.js`-suffixed relative imports (a NodeNext convention), which neither the unit test config nor the e2e config could resolve out of the box — both needed a `moduleNameMapper` fix.
- **e2e tests needed real environment loading and a Node flag.** Unlike unit tests (which mock everything), the e2e suite boots the real app, so it needed `.env` loaded via a Jest setup file — and that in turn surfaced a Prisma 7 WASM-loading issue (a dynamic `import()` that Jest's runtime can't handle without `--experimental-vm-modules`), fixed by wiring that flag into the e2e script.
- **A same-second token collision could have silently broken refresh rotation.** JWTs signed with identical payloads within the same second are byte-for-byte identical (second-level timestamp granularity), so two refreshes issued in quick succession could produce the "same" refresh token, making rotation a no-op. Caught directly by a rotation test failing unexpectedly; fixed by adding a random ID claim to every refresh token so each one is unique regardless of timing.
- **A design decision was needed on refresh token storage.** Chose to store a single refresh-token hash directly on the user record rather than a separate multi-session table, since this is a single-user personal tool with no multi-device requirement.
- **Native install script approvals, again.** argon2 (like a few Day 1 dependencies) ships a native binding that pnpm blocks from running its install script by default; had to be explicitly approved before installs would complete.

## End state

The full authentication flow — register, login, refresh (with rotation), logout, and a JWT-guarded protected endpoint — works end-to-end against the Dockerized API, verified from a completely clean database state. All backend code was built test-first; the full unit and e2e suites both run clean, matching the Day 2 acceptance criteria in the design doc.
