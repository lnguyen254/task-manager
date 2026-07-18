FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --filter web... --frozen-lockfile
WORKDIR /repo/apps/web
RUN pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build /repo/apps/web ./apps/web

WORKDIR /repo/apps/web
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "-p", "3001"]
