#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.server.yml}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$BACKUP_PATH"

echo "==> Datenbank sichern..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U inventory home_inventory \
  > "$BACKUP_PATH/database.sql"

echo "==> Uploads sichern..."
docker run --rm \
  -v home-inventory_uploads:/data:ro \
  -v "$(pwd)/$BACKUP_PATH":/backup \
  alpine tar czf /backup/uploads.tar.gz -C /data .

echo "==> Fertig: $BACKUP_PATH"
echo "    database.sql  $(du -sh "$BACKUP_PATH/database.sql" | cut -f1)"
echo "    uploads.tar.gz $(du -sh "$BACKUP_PATH/uploads.tar.gz" | cut -f1)"
