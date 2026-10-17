# Stage 1: build the SvelteKit app
FROM node:24-alpine AS builder
WORKDIR /app
# better-sqlite3 compiles from source when no prebuilt binary matches.
RUN apk add --no-cache python3 make g++ && npm install -g pnpm@12.8.1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG APP_ORIGIN=https://books.teleosis.ai
ENV APP_ORIGIN=${APP_ORIGIN}
RUN pnpm build && pnpm prune --prod

# Stage 2: runtime
FROM node:24-alpine
WORKDIR /app
# The sqlite CLI makes the backups in the sidecar.
RUN apk add --no-cache sqlite
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY scripts/backup ./scripts/backup
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/app/data/books.db
EXPOSE 3000
CMD ["node", "build"]
