# Home Inventory

Webanwendung zur Verwaltung von Haushaltsgegenständen — was liegt wo (Raum → Container → Gegenstand), in welcher Menge, mit Fotos, Kaufinformationen und Verleihistorie.

Technische Details: [TECHNICAL.md](TECHNICAL.md)

---

## Features

- **Hierarchische Struktur:** Raum → Container (beliebig tief verschachtelbar) → Gegenstand
- **Gegenstände:** Name, Menge, Einheit, Zustand (Neu/Gut/Abgenutzt/Defekt), Foto, Tags, Mindestbestand
- **Kaufinformationen:** Link, Preis, Datum, Garantie, Seriennummer, Barcode
- **Verleihistorie:** An Person verleihen, Rückgabe eintragen, aktive Ausleihen auf dem Dashboard
- **Volltextsuche** über Name, Beschreibung, Seriennummer und Barcode
- **Einheitenverwaltung:** Verwaltbare Vorschlagsliste für Mengeneinheiten (kg, L, Stück …) — übersetzbar per technischem Schlüssel
- **Tag-Verwaltung:** Frei definierbare Tags für Gegenstände (Werkzeug, Lebensmittel …), filterbar in der Übersicht — übersetzbar per technischem Schlüssel
- **Container-Typen:** Benutzerdefinierte Typen mit Emoji (Schrank, Karton …)
- **Gesamtübersicht:** Alle Gegenstände tabellarisch, nach Name gruppiert, mit Tag-Filter und Lagerort-Links
- **Mehrsprachig:** Deutsch (Standard) und Englisch, Sprachwahl in der Navigation
- **Rollen:** EDITOR (Lesen + Schreiben) und VIEWER (nur Lesen)

---

## Quickstart (Docker)

### Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) mit Docker Compose v2

### Option A — Produktivserver (fertige Images von Docker Hub)

```bash
# 1. Nur drei Dateien herunterladen (kein git clone nötig)
mkdir home-inventory && cd home-inventory
curl -O https://raw.githubusercontent.com/soschlegel/home-inventory/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/soschlegel/home-inventory/main/.env.example
mkdir nginx && curl -o nginx/nginx.conf https://raw.githubusercontent.com/soschlegel/home-inventory/main/nginx/nginx.conf

# 2. Umgebungsvariablen anlegen
cp .env.example .env
# DB_PASSWORD, JWT_SECRET und JWT_REFRESH_SECRET in .env setzen!

# 3. Starten (Images werden von Docker Hub geladen, kein Build)
docker compose up -d

# 4. App öffnen
open http://localhost:3000
```

### Option B — Lokale Entwicklung (mit Build aus Quellcode)

```bash
# 1. Repository klonen
git clone https://github.com/soschlegel/home-inventory.git
cd home-inventory

# 2. Umgebungsvariablen anlegen
cp .env.example .env
# DB_PASSWORD, JWT_SECRET und JWT_REFRESH_SECRET in .env setzen!

# 3. Container bauen und starten
docker compose -f docker-compose.dev.yml up -d --build

# 4. Testdaten einspielen
docker compose -f docker-compose.dev.yml exec backend npm run db:seed

# 5. App öffnen
open http://localhost:3000
```

**Demo-Zugänge:**

| Rolle  | E-Mail               | Passwort  |
|--------|----------------------|-----------|
| EDITOR | `test@home.local`    | `test1234` |
| VIEWER | `viewer@home.local`  | `test1234` |

> Beim ersten Start führt das Backend automatisch `prisma db push` aus.

---

## Lokale Entwicklung

### 1. Datenbank starten

```bash
docker compose up postgres -d
```

Alternativ (einmaliger Container ohne Compose):

```bash
docker run -d --name home-inventory-db \
  -e POSTGRES_USER=inventory \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=home_inventory \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # Werte anpassen

npx prisma db push          # Schema anwenden
npm run db:seed             # Testdaten einspielen
npm run dev                 # → http://localhost:4000
                            # → Swagger UI: http://localhost:4000/api/docs/
```

> **Windows:** `prisma db push` schlägt fehl, wenn der Backend-Server läuft (DLL-Lock).  
> Node-Prozesse zuerst stoppen: `Get-Process node | Stop-Process -Force`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # → http://localhost:5173
```

Vite proxied `/api/*` und `/uploads/*` automatisch an `localhost:4000`.

### Befehle Backend

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver (Hot-Reload) |
| `npm run build` | TypeScript kompilieren |
| `npm test` | Tests einmalig ausführen |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run test:coverage` | Tests mit Coverage-Report |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:seed` | Testdaten einspielen |
| `npm run db:studio` | Prisma Studio |

### Befehle Frontend

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Vite Dev-Server |
| `npm run build` | Produktions-Build |
| `npm test` | Tests einmalig ausführen |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run test:coverage` | Tests mit Coverage-Report |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Tests

```bash
# Alle Tests (Backend + Frontend)
bash scripts/test.sh

# Separat
cd backend && npm test
cd frontend && npm test
```

124 Backend-Tests (Vitest + supertest) · 12 Frontend-Tests (Vitest + jsdom)

---

## Umgebungsvariablen

### Stamm `.env` (Docker Compose)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `DB_PASSWORD` | `changeme` | PostgreSQL-Passwort |
| `JWT_SECRET` | `changeme_jwt_secret_please` | Secret für Access Tokens (min. 32 Zeichen) |
| `JWT_REFRESH_SECRET` | `changeme_refresh_secret_please` | Secret für Refresh Tokens (verschieden von JWT_SECRET) |
| `PORT` | `3000` | Öffentlicher Nginx-Port |
| `UPLOADS_DIR` | `/opt/home-inventory/uploads` | Pfad auf dem Host für hochgeladene Bilder |

### Backend `backend/.env` (lokale Entwicklung)

| Variable | Beispiel | Beschreibung |
|----------|---------|--------------|
| `DATABASE_URL` | `postgresql://inventory:changeme@localhost:5432/home_inventory` | Prisma-Connection-URL |
| `JWT_SECRET` | — | Wie oben |
| `JWT_REFRESH_SECRET` | — | Wie oben |
| `UPLOAD_DIR` | `./uploads` | Verzeichnis für hochgeladene Bilder |
| `PORT` | `4000` | Port des Express-Servers |

> `.env` ist in `.gitignore` und wird nie ins Repository eingecheckt.

---

## Docker-Deployment

| Service | Image | Port (intern) | Beschreibung |
|---------|-------|---------------|--------------|
| `postgres` | `postgres:16-alpine` | 5432 | Datenbank |
| `backend` | `soschlegel/home-inventory-backend` | 4000 | Express API + Swagger UI |
| `frontend` | `soschlegel/home-inventory-frontend` | 80 | React SPA |
| `nginx` | `nginx:alpine` | **3000** (öffentlich) | Reverse Proxy |

```bash
# Produktivserver (Standard)
docker compose up -d                # Starten
docker compose logs -f backend      # Logs
docker compose restart backend      # Einzelnen Service neu starten
docker compose down                 # Stoppen
docker compose down -v              # Stoppen + alle Daten löschen

# Lokale Entwicklung
docker compose -f docker-compose.dev.yml up -d --build
```

---

## Backup & Wiederherstellung

Die Daten liegen in zwei Docker-Volumes: `postgres_data` (Datenbank) und `uploads` (Bilder).

### Backup erstellen

```bash
# Sichert Datenbank + Uploads in ./backups/<timestamp>/
bash scripts/backup.sh
```

Das Backup enthält:

- `database.sql` — vollständiger PostgreSQL-Dump (alle Items, Räume, User, Tags …)
- `uploads.tar.gz` — alle hochgeladenen Bilder

### Wiederherstellen

```bash
bash scripts/restore.sh ./backups/2026-06-13_10-00-00
```

> Vor jedem Upgrade immer zuerst ein Backup anlegen.

---

## Releases & Upgrades

### Neues Release bauen und veröffentlichen (Entwicklungsrechner)

```bash
bash scripts/release.sh 1.1.0
```

Das Script:

1. Baut beide Docker-Images neu
2. Pusht `:latest` und `:1.1.0` auf Docker Hub
3. Setzt Git-Tag `v1.1.0` und pusht ihn

### Upgrade auf dem Server

```bash
# 1. Backup anlegen
bash scripts/backup.sh

# 2. Neue Images laden und Container neu starten
docker compose pull
docker compose up -d
```

`prisma db push` läuft automatisch beim Backend-Start und wendet neue Schemaänderungen an. Rein additive Änderungen (neue Tabellen, neue optionale Spalten) sind dabei immer sicher. Sobald eine Version Spalten umbenennt oder entfernt, steht das explizit in den Release-Notes.

### Rollback

```bash
# Alte Version pinnen
TAG=1.0.0 docker compose pull
TAG=1.0.0 docker compose up -d

# Falls nötig: Daten aus Backup zurückspielen
bash scripts/restore.sh ./backups/<timestamp>
```
