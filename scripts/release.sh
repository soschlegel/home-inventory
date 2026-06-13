#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Verwendung: $0 <version>"
  echo "Beispiel:   $0 1.0.0"
  exit 1
fi

echo "==> Images bauen..."
docker compose -f docker-compose.dev.yml build

echo "==> Als :latest pushen..."
docker compose -f docker-compose.dev.yml push

echo "==> Versionstag :$VERSION setzen und pushen..."
docker tag soschlegel/home-inventory-backend:latest soschlegel/home-inventory-backend:"$VERSION"
docker tag soschlegel/home-inventory-frontend:latest soschlegel/home-inventory-frontend:"$VERSION"
docker push soschlegel/home-inventory-backend:"$VERSION"
docker push soschlegel/home-inventory-frontend:"$VERSION"

echo "==> Git-Tag v$VERSION setzen..."
git tag -a "v$VERSION" -m "Release v$VERSION"
git push home-inventory "v$VERSION"

echo ""
echo "Release v$VERSION fertig."
echo "  backend:  docker.io/soschlegel/home-inventory-backend:$VERSION"
echo "  frontend: docker.io/soschlegel/home-inventory-frontend:$VERSION"
