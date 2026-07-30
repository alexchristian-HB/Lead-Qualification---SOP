# Production Multi-Stage Dockerfile for Node.js + Express + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests and install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Build Vite SPA and bundle server.ts -> dist/server.cjs
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
