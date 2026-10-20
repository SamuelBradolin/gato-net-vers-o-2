#!/bin/bash
# ====================================================================
# GATO NET — SCRIPT DE RESTAURAÇÃO DE BACKUP
# ====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-"gatonet_user"}
POSTGRES_DB=${POSTGRES_DB:-"gatonet_db"}

echo -e "${RED}====================================================${NC}"
echo -e "${RED}      GATO NET — RESTAURAÇÃO DE DESASTRE             ${NC}"
echo -e "${RED}====================================================${NC}"

if [ -z "$1" ]; then
    echo "Uso: bash scripts/restore.sh <caminho_do_arquivo_db.sql.gz> [caminho_uploads.tar.gz]"
    echo ""
    echo "Backups disponíveis em ./backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado na pasta backups/."
    exit 1
fi

DB_FILE="$1"
UPLOADS_FILE="$2"

if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}[ERRO] Arquivo de backup do banco não encontrado: $DB_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}[ATENÇÃO] Esta operação irá sobrescrever a base de dados '$POSTGRES_DB'!${NC}"
read -p "Deseja continuar? Digite 'SIM' para confirmar: " CONFIRM

if [ "$CONFIRM" != "SIM" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
fi

echo -e "\n${BLUE}[1/2] Restaurando banco de dados PostgreSQL 16...${NC}"
gunzip -c "$DB_FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
echo -e "${GREEN}✓ Banco de dados restaurado com sucesso!${NC}"

# Restaurar uploads se arquivo for fornecido
if [ -n "$UPLOADS_FILE" ] && [ -f "$UPLOADS_FILE" ]; then
    echo -e "\n${BLUE}[2/2] Restaurando pasta de uploads...${NC}"
    tar -xzf "$UPLOADS_FILE"
    echo -e "${GREEN}✓ Uploads restaurados com sucesso!${NC}"
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ RESTAURAÇÃO FINALIZADA COM SUCESSO!             ${NC}"
echo -e "${GREEN}====================================================${NC}"
