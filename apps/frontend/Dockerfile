FROM oven/bun:latest AS base

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/
RUN bun install

# Copy source
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend

# Build Next.js
ENV NODE_ENV=production
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
