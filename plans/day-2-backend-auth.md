# Day 2 — Backend auth

Goal: a complete, tested register/login/refresh/logout flow issuing JWTs, running against the Dockerized API and Postgres.

## Steps

1. Create the `AuthModule` in `apps/api` with a `UsersService`/repository layer (via Prisma) backing it.
2. Implement registration.
   - Validate input with a `class-validator` DTO (email, password, name).
   - Hash the password with Argon2 before persisting the `User`.
   - Reject duplicate emails with a clear error shape.
3. Implement login.
   - Verify credentials against the stored Argon2 hash.
   - Issue a short-lived access JWT (~15 min) and a longer-lived refresh JWT (~7 days).
4. Implement refresh.
   - Validate the incoming refresh token, rotate it (invalidate the old one, issue a new refresh + access pair) on every use.
5. Implement logout.
   - Invalidate the current refresh token so it can no longer be used to mint new access tokens.
6. Add the JWT strategy and guards.
   - `AuthGuard` to protect authenticated routes.
   - `@CurrentUser()` decorator to pull the verified user off the request in downstream handlers.
7. Wire up `GET /users/me` behind the guard as the first protected endpoint, returning the current user's profile.
8. Write unit tests for `AuthService`: password hashing/verification, token issuance, token verification, refresh rotation logic (old refresh token rejected after use).
9. Write e2e tests (Supertest) covering the full flow: register → login → refresh → logout, including failure cases (wrong password, expired/reused refresh token, missing/invalid access token on a protected route).
10. Verify:
    - Full unit + e2e suite green.
    - Manual `curl`/Postman walkthrough of register → login → call `/users/me` → refresh → logout against the Dockerized API.
