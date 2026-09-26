# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# Imagem de produção do Chá de Panela (Next.js standalone + Prisma).
#
# Build:
#   docker build \
#     --build-arg NEXT_PUBLIC_BETTER_AUTH_URL=https://chadepanela.egnehl.easypanel.host \
#     -t cha-de-panela .
#
# Run (variáveis do .env.producao):
#   docker run -d --name cha-de-panela --restart unless-stopped \
#     --env-file .env.producao -p 6200:6200 cha-de-panela
#
# Atualizar o schema do banco:
#   docker exec cha-de-panela prisma db push
# ------------------------------------------------------------

ARG NODE_VERSION=24

# Base com OpenSSL, exigido pelo query engine do Prisma.
FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependências (camada em cache enquanto package*.json não mudar).
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build da aplicação.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis NEXT_PUBLIC_ são embutidas no bundle do navegador durante o build.
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# Imagem final: só o servidor standalone, arquivos estáticos e o Prisma.
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# O server.js do standalone escuta em HOSTNAME:PORT.
ENV HOSTNAME=0.0.0.0
ENV PORT=6200

# CLI do Prisma para rodar "prisma db push" dentro do container.
RUN npm install -g prisma@6.19.3 && npm cache clean --force

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Client e query engine gerados pelo Prisma.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 6200

CMD ["node", "server.js"]
