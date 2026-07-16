# Day 5 — Frontend tasks UI

Goal: full task CRUD usable end-to-end through the UI, backed by the BFF proxy and TanStack Query.

## Steps

1. Add BFF proxy route handlers for the task/tag endpoints (`/api/tasks`, `/api/tasks/:id`, `/api/tags`, etc.), forwarding to NestJS with the session cookie attached server-side.
2. Set up TanStack Query in the app (provider/client setup) for caching, refetching, and optimistic updates on task data.
3. Build the task list page:
   - Fetch and render tasks via TanStack Query against the BFF `/api/tasks` route.
   - Render each task with status, priority, due date, and tags per the design direction (badges/pills, priority indicator).
4. Build the create task flow: form (react-hook-form + Zod) for title, description, status, priority, due date, tags — submits via the BFF proxy, invalidates/updates the task list query on success.
5. Build the edit task flow: same form pre-populated with existing values, submits a `PATCH`, updates the cached list on success.
6. Build delete with confirmation: confirmation dialog before calling `DELETE`, removes the task from the cached list on success.
7. Build filtering/sorting UI: status filter, priority filter, tag filter, search-by-title, sort dropdown — all reflected in the query params sent to `GET /tasks` via the BFF.
8. Build tag creation/selection inline within the task form (per the design prompt's "inline create new tag" behavior).
9. Verify:
   - Full task CRUD (create, read/list, update, delete) works end-to-end through the UI against the Dockerized backend.
   - Filtering, sorting, and search all correctly affect the displayed list.
   - Deleting a task requires confirmation and correctly updates the list without a full page reload.
