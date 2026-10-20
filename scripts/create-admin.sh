#!/bin/bash
# ====================================================================
# GATO NET — CRIAR ADMINISTRADOR SUPERADMIN VIA CLI NA VPS
# ====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}      CRIAÇÃO DE ADMINISTRADOR — GATO NET           ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Verificar se container app está ativo
if ! docker compose ps | grep -q "gatonet_app"; then
    echo -e "${RED}[ERRO] O container 'gatonet_app' não está em execução.${NC}"
    echo "Inicie a aplicação primeiro com: bash scripts/deploy.sh"
    exit 1
fi

echo -e "Informe os dados do novo administrador:"
read -p "Nome Completo [Administrador Geral]: " ADMIN_NAME
ADMIN_NAME=${ADMIN_NAME:-"Administrador Geral"}

read -p "E-mail de Acesso [admin@gatonet.tv]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@gatonet.tv"}

while true; do
    read -s -p "Senha Segura (mínimo 8 caracteres): " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -ge 8 ]; then
        break
    else
        echo -e "${RED}A senha deve ter pelo menos 8 caracteres!${NC}"
    fi
done

echo -e "\n${BLUE}Criando administrador no banco de dados com Argon2id...${NC}"

docker compose exec -T app npx tsx src/server/scripts/createAdmin.ts "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$ADMIN_NAME"

echo -e "\n${GREEN}✓ Administrador configurado com sucesso!${NC}"
echo -e "Acesse o painel pelo menu do cabeçalho da plataforma."
