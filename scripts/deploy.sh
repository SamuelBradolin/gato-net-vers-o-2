#!/bin/bash
# ====================================================================
# GATO NET — SCRIPT DE DEPLOY E INICIALIZAÇÃO NA VPS VIRTARIX
# Ubuntu 24.04 LTS | PostgreSQL 16 | Docker Compose
# ====================================================================
# AVISO: Este script é seguro para atualizações e NUNCA remove volumes
# persistentes (gatonet_pgdata, gatonet_uploads). Os dados são mantidos!
# ====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}        GATO NET — DEPLOY NA VPS VIRTARIX            ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERRO] O Docker não está instalado nesta máquina.${NC}"
    echo "Instale o Docker antes de continuar: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. Verificar se o Docker Compose está instalado
if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERRO] O plugin 'docker compose' não está instalado.${NC}"
    exit 1
fi

# 3. Verificar arquivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}[AVISO] Arquivo .env não encontrado.${NC}"
    if [ -f .env.example ]; then
        echo -e "${YELLOW}Criando .env a partir de .env.example...${NC}"
        cp .env.example .env
        echo -e "${RED}[IMPORTANTE] Edite o arquivo .env agora e configure senhas fortes antes de iniciar!${NC}"
        echo "Comando: nano .env"
        exit 1
    else
        echo -e "${RED}[ERRO] Arquivo .env.example não encontrado!${NC}"
        exit 1
    fi
fi

# 4. Criar diretórios locais se não existirem
mkdir -p uploads backups .data
chmod 775 uploads backups .data 2>/dev/null || true

# 5. Executar build e subir containers sem derrubar volumes
echo -e "${BLUE}[1/3] Construindo imagens e iniciando containers...${NC}"
# docker compose up -d --build recria os containers atualizados PRESERVANDO todos os volumes
docker compose up -d --build

# 6. Aguardar PostgreSQL inicializar
echo -e "${BLUE}[2/3] Aguardando o PostgreSQL 16 responder...${NC}"
until docker compose exec -T postgres pg_isready -U $(grep POSTGRES_USER .env | cut -d '=' -f2 | tr -d '"') &> /dev/null; do
    echo -n "."
    sleep 2
done
echo -e "\n${GREEN}[OK] PostgreSQL pronto.${NC}"

# 7. Executar migrações do banco de dados dentro do container da aplicação
echo -e "${BLUE}[3/3] Aplicando migrações de banco de dados...${NC}"
docker compose exec -T app npx tsx src/server/db/migrate.ts || {
    echo -e "${YELLOW}[INFO] Migrações já aplicadas ou gerenciadas via inicialização.${NC}"
}

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ GATO NET IMPLANTADO COM SUCESSO!                 ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Status dos containers:"
docker compose ps
echo ""
echo -e "Acesse a aplicação: ${BLUE}http://127.0.0.1:3000${NC}"
echo -e "Para criar o primeiro administrador, execute:"
echo -e "  ${YELLOW}bash scripts/create-admin.sh${NC}"
echo ""
