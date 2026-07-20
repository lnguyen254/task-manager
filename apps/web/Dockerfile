FROM node:22-alpine AS base
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --filter web... --frozen-lockfile
WORKDIR /repo/apps/web
RUN pnpm run build
# Strips devDependency-only packages (typescript, eslint, tailwindcss, ...)
# that `next build` needed but `next start` doesn't, from the runtime image.
RUN pnpm prune --prod

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build --chown=node:node /repo/apps/web ./apps/web

WORKDIR /repo/apps/web
USER node
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "-p", "3001"]
