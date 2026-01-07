FROM oven/bun:latest

WORKDIR /app

# Copy root package files for workspace support
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN bun install

# Copy backend source
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Generate Prisma Client (if schema exists)
RUN if [ -f prisma/schema.prisma ]; then bunx prisma generate; fi

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
