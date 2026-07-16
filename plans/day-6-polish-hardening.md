# Day 6 — Polish & hardening

Goal: the app feels finished and behaves correctly at the edges, and the backend's security posture matches the design doc.

## Steps

1. Frontend state coverage:
   - Loading states (skeleton rows, not full-page spinners) for the task list and any async fetch.
   - Empty state (no tasks yet) vs. empty-after-filtering state, each with distinct copy and a relevant action.
   - Validation error states on all forms (login, register, task create/edit).
   - Session-expired handling: a stale/invalid session redirects to login with a clear message rather than failing silently.
   - Toast/notification pattern for success actions ("Task created", "Task deleted", etc.) — non-blocking, auto-dismissing.
2. Responsive layout pass across login, register, task list, and the create/edit form at desktop, tablet, and mobile widths (per the design prompt's responsive behavior section — filters collapsing into a sheet, forms going full-screen on mobile, task rows stacking metadata).
3. Backend security hardening pass:
   - Add Helmet for security headers.
   - Add `@nestjs/throttler` for rate limiting, applied especially to `/auth/*` endpoints.
   - Lock CORS to the Next.js app's origin only.
   - Confirm the global exception filter returns a consistent `{ statusCode, message, error }` shape and never leaks stack traces outside development.
   - Add environment variable validation at boot (Zod) so the API fails fast on missing/malformed config.
4. Manual test pass against the full stack (`docker compose up`) covering:
   - Golden path: register → login → create/edit/filter/delete tasks → logout.
   - Edge cases: invalid input on every form, expired session mid-use, empty task list, empty filtered list, duplicate tag name, deleting a tag that's in use.
5. Log and fix any bugs found during the manual pass before moving to Day 7.
6. Verify:
   - No console errors during the manual pass.
   - All identified edge cases behave as designed (clear error messaging, no silent failures, no crashes).
