# ====================================================================
# GATO NET — MULTI-STAGE DOCKERFILE PARA UBUNTU 24.04 LTS (VPS VIRTARIX)
# ====================================================================

# STAGE 1: Build da aplicação Frontend React 19 + Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências para o build
COPY package*.json ./
RUN npm ci

# Copiar código fonte e gerar bundle de produção
COPY . .
RUN npm run build

# STAGE 2: Imagem final de execução em Produção
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalar somente dependências de execução
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar artefatos compilados do estágio builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY tsconfig.json ./

# Criar diretórios de dados persistentes para uploads e banco fallback
RUN mkdir -p /app/uploads /app/.data && chmod 777 /app/uploads /app/.data

EXPOSE 3000

# Healthcheck do container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["npx", "tsx", "server.ts"]
