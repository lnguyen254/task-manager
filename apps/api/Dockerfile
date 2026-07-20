FROM node:22-alpine AS base
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --filter api... --frozen-lockfile
WORKDIR /repo/apps/api
RUN pnpm exec prisma generate
RUN pnpm run build
# `prisma` (the CLI, needed below for `migrate deploy`) is a runtime
# dependency; everything else devDependency-only (jest, eslint, typescript,
# ts-node, ...) is stripped so it never reaches the runtime image.
RUN pnpm prune --prod

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build --chown=node:node /repo/apps/api ./apps/api

WORKDIR /repo/apps/api
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
