# Day 4 — Frontend scaffold + auth wiring

Goal: the Next.js app styled and structured, with login/register working end-to-end against the Dockerized backend via the BFF proxy pattern.

## Steps

1. Set up Tailwind CSS (if not already finalized on Day 1) and install/configure shadcn/ui in `apps/web`.
2. Build the base layout: shared shell, navigation placeholder, typography/color setup matching the intended design direction.
3. Add `web` to `docker-compose.yml` as a service depending on `api`, so the full stack (`postgres` + `api` + `web`) can come up together from this point forward.
4. Implement the BFF proxy pattern in Next.js Route Handlers:
   - `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` route handlers that forward to the corresponding NestJS endpoints.
   - On successful login/register, set the JWT in an httpOnly, secure, SameSite cookie — the browser never sees the raw token.
   - All other future API calls will go through a similar server-side proxy pattern, attaching the cookie to the forwarded request.
5. Build the login page: form (react-hook-form + Zod validation), calls the `/api/auth/login` route handler, redirects to an authenticated page on success, surfaces inline errors on failure.
6. Build the register page: same pattern, with password requirement helper text, redirects to login (or directly logs in) on success.
7. Add basic session handling on the frontend: a way to detect "logged in" state (e.g., a server-side check or a lightweight `/api/auth/me` proxy to `GET /users/me`) so protected pages can redirect unauthenticated visitors to login.
8. Add a logout action wired to `/api/auth/logout`, clearing the session cookie and redirecting to login.
9. Verify:
   - Full stack up via `docker compose up` (postgres + api + web).
   - Can register a new user, get redirected/logged in, and land on an authenticated page.
   - Confirm in browser dev tools that the session cookie is httpOnly, secure, and SameSite — and that no raw JWT is visible to client-side JavaScript.
