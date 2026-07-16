# Day 1 — Scaffold: Summary

Status: Complete. All 7 steps from `plans/day-1-scaffold.md` executed and verified.

## What was done

1. **Workspace initialized.** Set up the repo as a pnpm workspace with `apps/*` as the package scope, plus shared root-level scripts for running dev/build/lint/test across every app at once.

2. **Backend app scaffolded.** Created the NestJS application in `apps/api` and confirmed it starts up and responds on its own, before any Docker involvement.

3. **Frontend app scaffolded.** Created the Next.js application in `apps/web` (App Router, TypeScript, Tailwind) and confirmed it starts up on its own. Configured it to run on a different port than the backend so both can run side by side locally without conflicting.

4. **Database schema defined.** Added Prisma to the backend, wrote out the full data model (users, tasks, tags, and the tag-task relationship, matching the design doc), and generated + applied the first migration against a real Postgres database to confirm the schema is valid and all tables get created correctly.

5. **Health check added.** Added a minimal `/health` endpoint to the backend that confirms the server process is running. Kept it intentionally simple for now — a deeper check that also verifies database connectivity is planned for Day 7.

6. **Docker Compose set up.** Wrote the Docker configuration to bring up Postgres and the backend API together as containers, with the API waiting for Postgres to be healthy before starting and automatically applying database migrations on startup. Verified this works reliably from a completely clean state (fresh containers, fresh database volume).

7. **Environment variable examples added.** Documented the environment variables needed to run the project, both for running the backend locally and for running everything through Docker, so the setup is reproducible by anyone cloning the project. Also made sure real environment files (containing local credentials) are excluded from version control.

## Notable issues hit and resolved along the way

- **Package install approvals:** pnpm blocks certain dependencies from running their install scripts by default as a security measure. Had to explicitly approve a handful of legitimate ones (used by ESLint, Next.js image handling, and Prisma) before installs would complete.
- **Stray nested config files:** A couple of tool-generated files ended up duplicated in the wrong place (a nested git repository, and a nested package-manager config) during scaffolding. Both were cleaned up so the project has one consistent setup at the root.
- **Docker image didn't match how the workspace actually works:** The first version of the backend's Docker setup didn't correctly carry over all the shared dependencies, was missing a required configuration file, was risking baking local secrets into the image, used a Node.js version that was too old for the package manager, and relied on a runtime behavior that unexpectedly tried to reinstall dependencies over the network every time the container started. All of these were caught during a review pass before first bringing the containers up, and fixed.
- **Database container version mismatch:** The Postgres version in use changed how it expects its data folder to be mounted; the container failed to start until the volume configuration was updated to match.
- **Build output landing in the wrong place:** The backend's compiled output was initially nesting itself in an unexpected subfolder because the build process was picking up extra files it shouldn't have. Fixed by scoping the build to only the actual application source.

## End state

Running `docker compose up` from a clean checkout brings up the database and backend API together, with migrations applied automatically and the health endpoint responding successfully — matching the Day 1 acceptance criteria in the design doc.
