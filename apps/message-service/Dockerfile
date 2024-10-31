
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

COPY ./package*.json ./
RUN npm install

RUN npm i tsc -g

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

COPY --from=builder /app/ ./

EXPOSE 4000


CMD ["npm", "start"]