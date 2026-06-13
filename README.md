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

### Starten

```bash
# 1. Repository klonen
git clone <repo-url>
cd home-inventory

# 2. Umgebungsvariablen anlegen
cp .env.example .env
# DB_PASSWORD, JWT_SECRET und JWT_REFRESH_SECRET in .env setzen!

# 3. Container bauen und starten
docker compose up -d --build

# 4. Testdaten einspielen
docker compose exec backend sh -c "npx prisma db seed"

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
| `backend` | lokaler Build | 4000 | Express API + Swagger UI |
| `frontend` | lokaler Build | 80 | React SPA |
| `nginx` | `nginx:alpine` | **3000** (öffentlich) | Reverse Proxy |

```bash
docker compose up -d --build        # Starten (mit Build)
docker compose logs -f backend      # Logs
docker compose restart backend      # Einzelnen Service neu starten
docker compose down                 # Stoppen
docker compose down -v              # Stoppen + alle Daten löschen
```
