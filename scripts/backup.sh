#!/bin/bash
# ====================================================================
# GATO NET — SCRIPT DE BACKUP AUTOMÁTICO (POSTGRESQL & UPLOADS)
# ====================================================================
# Executa dump comprimido do banco PostgreSQL 16 e arquiva a pasta
# de uploads (logotipos, favicons, comprovantes).
# Pode ser executado manualmente ou agendado no crontab da VPS.
# ====================================================================

set -e

# Configurações de Retenção
BACKUP_DIR="$(pwd)/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-"gatonet_user"}
POSTGRES_DB=${POSTGRES_DB:-"gatonet_db"}

mkdir -p "$BACKUP_DIR"

echo "===================================================="
echo "  GATO NET — ROTINA DE BACKUP: $TIMESTAMP"
echo "===================================================="

# 1. Backup do Banco de Dados PostgreSQL 16
DB_BACKUP_FILE="$BACKUP_DIR/gatonet_db_${TIMESTAMP}.sql.gz"
echo "[1/2] Gerando dump comprimido do banco de dados ($POSTGRES_DB)..."

if docker compose ps | grep -q "gatonet_postgres"; then
    docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip -9 > "$DB_BACKUP_FILE"
    echo "  ✓ Dump concluído: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
else
    echo "  [AVISO] Container 'gatonet_postgres' não está ativo. Tentando backup do arquivo local..."
    if [ -f .data/gatonet_db.json ]; then
        cp .data/gatonet_db.json "$BACKUP_DIR/gatonet_db_${TIMESTAMP}.json"
        gzip -9 "$BACKUP_DIR/gatonet_db_${TIMESTAMP}.json"
        echo "  ✓ Backup JSON concluído: $BACKUP_DIR/gatonet_db_${TIMESTAMP}.json.gz"
    fi
fi

# 2. Backup dos Arquivos de Uploads (Logos, Favicons, Imagens)
UPLOADS_BACKUP_FILE="$BACKUP_DIR/gatonet_uploads_${TIMESTAMP}.tar.gz"
echo "[2/2] Compactando pasta de uploads..."

if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    tar -czf "$UPLOADS_BACKUP_FILE" uploads/
    echo "  ✓ Uploads compactados: $UPLOADS_BACKUP_FILE ($(du -h "$UPLOADS_BACKUP_FILE" | cut -f1))"
else
    echo "  [INFO] Pasta uploads vazia ou sem arquivos adicionais."
fi

# 3. Rotação de Backups Antigos (Limpeza além do período de retenção)
echo "Limpando backups com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -type f \( -name "gatonet_db_*.sql.gz" -o -name "gatonet_uploads_*.tar.gz" -o -name "gatonet_db_*.json.gz" \) -mtime +$RETENTION_DAYS -delete

echo "===================================================="
echo "  ✓ BACKUP CONCLUÍDO COM SUCESSO!"
echo "  Localização: $BACKUP_DIR"
echo "===================================================="
