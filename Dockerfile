# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install bun (project uses bun, but npm also works)
RUN apk add --no-cache bash curl

COPY package.json bun.lockb* package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .

# Vite build-time env vars (passed from Dokploy)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY"
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine
RUN apk add --no-cache curl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -fsS http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]