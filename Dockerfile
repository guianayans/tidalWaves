# tidalWaves — self-hosted Strudel + custom backend
# Multi-stage build: (1) build the Strudel website (Astro static site),
# (2) install backend deps, (3) slim runtime with ffmpeg for recordings.

FROM node:22-slim AS strudel-build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ git \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.19.0
WORKDIR /build
COPY strudel/pnpm-workspace.yaml strudel/package.json strudel/pnpm-lock.yaml ./
COPY strudel/packages/ ./packages/
COPY strudel/examples/ ./examples/
COPY strudel/tools/ ./tools/
RUN mkdir -p website/public
COPY strudel/website/package.json ./website/
RUN pnpm install --frozen-lockfile
COPY strudel/ .
RUN npm run build

FROM node:22-slim AS server-build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /build/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

FROM node:22-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server ./server
COPY --from=strudel-build /build/website/dist ./website-dist
COPY --from=server-build /build/server/node_modules ./server/node_modules
ENV NODE_ENV=production
EXPOSE 4025
CMD ["node", "server/src/index.js"]
