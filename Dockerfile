FROM --platform=linux/amd64 node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:20-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000
# Nest builds can produce either:
# - dist/main.js (common when TS rootDir is src)
# - dist/src/main.js (common when the TS project includes files outside src)
# Prefer dist/main.js but fall back to dist/src/main.js.
CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; else node dist/src/main.js; fi"]
