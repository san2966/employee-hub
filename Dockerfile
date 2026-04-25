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

RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]