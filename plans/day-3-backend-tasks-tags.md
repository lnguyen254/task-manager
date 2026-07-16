# Day 3 — Backend tasks & tags

Goal: complete, ownership-scoped CRUD for tasks and tags, with filtering/sorting/pagination, fully tested including cross-user access denial.

## Steps

1. Create the `TasksModule` in `apps/api`.
   - DTOs (with `class-validator`) for create and update payloads: title (required), description (optional), status, priority, dueDate, tag associations.
   - Every query and mutation scoped by `userId` pulled from the verified JWT (via `@CurrentUser()`), enforced in the service layer — not just the controller.
2. Implement the task endpoints:
   - `GET /tasks` — list with filter (status, priority, tag), search (title), sort, pagination.
   - `POST /tasks` — create.
   - `GET /tasks/:id` — detail (404 if not found or not owned by the requester).
   - `PATCH /tasks/:id` — update.
   - `DELETE /tasks/:id` — delete.
3. Create the `TagsModule`.
   - DTOs for create/delete.
   - Enforce the `@@unique([userId, name])` constraint from the schema with a clear conflict error on duplicate tag names per user.
4. Implement the tag endpoints: `GET /tags`, `POST /tags`, `DELETE /tags/:id` — all ownership-scoped.
5. Wire the `TaskTag` join logic so creating/updating a task can attach/detach tags in one request.
6. Add global `ValidationPipe` config (`whitelist: true, forbidNonWhitelisted: true`) if not already set up on Day 2, so it covers these new DTOs too.
7. Write unit tests for `TasksService`: CRUD logic, authorization/ownership checks (a query built for user A never returns user B's rows), filtering/sorting edge cases (empty filters, combined filters, invalid sort field).
8. Write e2e tests: full task CRUD lifecycle, tag CRUD lifecycle, and an explicit test that a second registered user cannot read, update, or delete the first user's tasks or tags (expect 404/403, not data leakage).
9. Confirm Swagger/OpenAPI decorators are present on all new endpoints and DTOs.
10. Verify:
    - Full unit + e2e suite green, including the cross-user denial tests.
    - Swagger docs render all task/tag endpoints correctly with accurate request/response shapes.
