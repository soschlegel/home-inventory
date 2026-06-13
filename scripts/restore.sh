#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_PATH="${1:-}"

if [[ -z "$BACKUP_PATH" ]]; then
  echo "Verwendung: $0 <backup-verzeichnis>"
  echo "Beispiel:   $0 ./backups/2026-06-13_10-00-00"
  exit 1
fi

if [[ ! -f "$BACKUP_PATH/database.sql" ]]; then
  echo "Fehler: $BACKUP_PATH/database.sql nicht gefunden"
  exit 1
fi

read -rp "Achtung: Alle aktuellen Daten werden überschrieben. Fortfahren? [j/N] " confirm
[[ "$confirm" =~ ^[jJyY]$ ]] || { echo "Abgebrochen."; exit 0; }

echo "==> Datenbank wiederherstellen..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U inventory -c "DROP DATABASE IF EXISTS home_inventory;" postgres
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U inventory -c "CREATE DATABASE home_inventory;" postgres
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U inventory home_inventory \
  < "$BACKUP_PATH/database.sql"

if [[ -f "$BACKUP_PATH/uploads.tar.gz" ]]; then
  echo "==> Uploads wiederherstellen..."
  docker run --rm \
    -v home-inventory_uploads:/data \
    -v "$(pwd)/$BACKUP_PATH":/backup \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/uploads.tar.gz -C /data"
fi

echo "==> Wiederherstellung abgeschlossen."
