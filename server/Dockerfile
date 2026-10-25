# Build context is the REPO ROOT (see docker-compose.yml: `build: { context: ., dockerfile:
# server/Dockerfile }`), not server/ — this image needs both the backend source AND the
# already-built frontend (root-level dist/), and Docker can't COPY from outside its context.
#
# The frontend's own build is untouched by this migration (per "current active web stays as it
# is" — see DEPLOY_INTERNAL.md) — you build it yourself with the internal server's env vars
# before running `docker compose build`, same `npm run build` command as always, just pointed at
# a different .env.

FROM node:22-slim AS build
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server/schema.sql server/seed-reference-data.sql ./
# The frontend's already-built dist/ (see the note above) — copied in from the repo root.
COPY dist ./frontend-dist
ENV FRONTEND_DIST=/app/frontend-dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
