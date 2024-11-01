FROM node:20-alpine AS base

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ARG CLERK_SECRET_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

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

EXPOSE 3000
CMD ["npm", "start"]
