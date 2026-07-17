# Day 3 — Backend tasks & tags: Summary

Status: Complete. All 10 steps from `plans/day-3-backend-tasks-tags.md` executed and verified.

## What was done

1. **TasksModule scaffolded.** Added `CreateTaskDto`/`UpdateTaskDto` (title, description, status, priority, dueDate, tag associations) validated with `class-validator`, and wired the module into `AppModule`. Established the ownership principle up front: every task query/mutation is scoped by the `userId` pulled from the verified JWT, enforced at the service layer rather than trusted from client input.

2. **Task endpoints implemented.** Full CRUD (`GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`), with `GET /tasks` supporting filtering (status, priority, a single tag), case-insensitive title search, a whitelisted set of sortable fields (invalid values rejected with a 400 rather than silently ignored), and page-based pagination that returns a total count so clients can render page controls.

3. **TagsModule created.** Added `CreateTagDto` and a `TagsService.create()` that relies on the schema's `@@unique([userId, name])` constraint, catching the underlying Prisma unique-violation error and turning it into a clear 409 Conflict rather than a raw database error.

4. **Tag endpoints implemented.** `GET /tags`, `POST /tags`, `DELETE /tags/:id`, all ownership-scoped the same way as tasks.

5. **Task↔tag join logic confirmed.** Creating or updating a task can attach, replace, or clear its tags in a single request (`tagIds` on the DTO), backed by a transaction-safe Prisma nested write. This was largely built alongside the task endpoints in step 2 and separately verified live in step 5, including the "omit `tagIds` entirely and existing tags stay untouched" case.

6. **Global `ValidationPipe` coverage confirmed.** The `whitelist`/`forbidNonWhitelisted`/`transform` pipe set up on Day 2 already covered the new DTOs with no changes needed — verified live that unrecognized fields (including an attempt to spoof `userId` directly in a task body) are rejected with a 400.

7. **Unit tests for `TasksService`.** CRUD logic, ownership isolation (the same query scoped differently per user, proven side-by-side for two different callers), and filtering/sorting edge cases (empty filters, combined filters, invalid sort field) — 17 tests, all built test-first.

8. **e2e tests written.** Full task CRUD lifecycle and full tag CRUD lifecycle, plus explicit cross-user denial tests for both resources: a second registered user gets 404 (never 200, never a data leak) on read/update/delete of the first user's tasks or tags, and neither resource appears in the second user's list.

9. **Swagger/OpenAPI added.** Installed `@nestjs/swagger` with its CLI plugin enabled (auto-infers DTO schemas from existing TypeScript types and `class-validator` decorators, so DTOs didn't need manual annotation), wired `SwaggerModule` into `main.ts` at `/api/docs`, and added `@ApiTags`/`@ApiBearerAuth`/`@ApiOperation`/`@ApiResponse` to both new controllers.

10. **Full verification pass.** Ran the complete unit and e2e suites, and visually confirmed the rendered Swagger docs, against a freshly-provisioned Dockerized stack (fresh volume, fresh containers) — matching the same from-a-clean-state rigor used on Day 1 and Day 2.

## Notable issues hit and resolved along the way

- **`reflect-metadata` isn't loaded in the unit test environment.** `class-transformer`'s `@Type()` decorator needs the `Reflect.getMetadata` polyfill, which only the e2e Jest config loads (via its setup file) — using `@Type` on `QueryTasksDto`'s `page`/`limit` fields broke unit tests with `Reflect.getMetadata is not a function`. Switched to `@Transform` instead, which doesn't need the polyfill, avoiding a shared jest config change for a single DTO.
- **A stale pnpm build-approval placeholder blocked the Docker build.** Adding `@nestjs/swagger` pulled in `@scarf/scarf` (an analytics postinstall beacon), and pnpm auto-added an unresolved placeholder entry for it in `pnpm-workspace.yaml`. That placeholder only produced a soft warning locally but hard-failed Docker's `--frozen-lockfile` install. Resolved by explicitly denying the build (not needed for functionality), consistent with Day 1's precedent of only approving install scripts actually required.
- **A test-helper bug, not a production bug.** The e2e login helper assumed `POST /auth/login` returns 200, but NestJS defaults POST handlers to 201 unless `@HttpCode` overrides it, and `login` never got that override on Day 2. Fixed the helper's expectation rather than the endpoint.
- **A pre-existing, unrelated TypeScript error was found (not fixed).** `tsc --noEmit` surfaced a latent type error in `auth.service.spec.ts` (a Day 2 test fixture missing `createdAt`) that Jest's own type checking doesn't catch. Flagged to the user but left alone as out of scope for Day 3.

## End state

Tasks and tags now have complete, ownership-scoped CRUD, with filtering, search, sorting, and pagination on the task list, and per-user unique tag names enforced with a clear conflict error. Tag associations can be attached, replaced, or cleared in the same request as a task create/update. Every endpoint and DTO is documented in Swagger with accurate request/response shapes. The full unit and e2e suites — including explicit cross-user denial tests proving no data leakage — run clean from a completely fresh database state, matching the Day 3 acceptance criteria in the design doc.
