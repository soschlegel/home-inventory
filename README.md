# Home Inventory

Webanwendung zur vollständigen Verwaltung von Haushaltsgegenständen — was liegt wo, in welcher Menge, mit Fotos, Kaufinformationen und Verleihistorie.

---

## Inhaltsverzeichnis

1. [Features](#features)
2. [Quickstart](#quickstart)
3. [Lokale Entwicklung](#lokale-entwicklung)
4. [Tests](#tests)
5. [Umgebungsvariablen](#umgebungsvariablen)
6. [Projektstruktur](#projektstruktur)
7. [Technische Dokumentation](#technische-dokumentation)
   - [Systemarchitektur](#systemarchitektur)
   - [Datenmodell](#datenmodell)
   - [API-Dokumentation](#api-dokumentation)
   - [Authentifizierung & Rollen](#authentifizierung--rollen)
   - [Datei-Upload](#datei-upload)
   - [Prisma & Schema](#prisma--schema)
8. [Docker-Deployment](#docker-deployment)
9. [Code-Qualität](#code-qualität)

---

## Features

### Inventarverwaltung

- Hierarchische Struktur: **Raum → Container → Gegenstand**
- Container beliebig tief verschachtelbar (Schrank → Schublade → Box)
- Benutzerdefinierte **Container-Typen** mit Emoji und Farbe
- Volltextsuche über Name, Beschreibung, Seriennummer und Barcode
- Mindestbestand-Warnung auf dem Dashboard
- **Gemeinsames Inventar** für alle Nutzer — Räume und Gegenstände sind nicht benutzerspezifisch

### Gegenstände

- Name, Beschreibung, Menge und Einheit
- Foto-Upload (JPEG, PNG, WebP — max. 10 MB)
- Zustand: Neu / Gut / Abgenutzt / Defekt
- Tags zur freien Kategorisierung (Mehrfachzuordnung)
- Mindestbestand-Schwellwert
- Vollständig bearbeitbar inkl. Kaufinformationen und Tags

### Kaufinformationen pro Gegenstand

- Kauflink (Amazon, Online-Shop o. ä.)
- Kaufpreis und Kaufdatum
- Garantie-Ablaufdatum
- Seriennummer
- Barcode / EAN (Vorbereitung für spätere Scan-Funktion)

### Verleihistorie

- Gegenstände an Personen verleihen (Name + optionale Notiz)
- Rückgabe mit Datum eintragen
- Vollständige Verleihistorie pro Gegenstand
- Übersicht aller aktuell ausgeliehenen Gegenstände

### Benutzerverwaltung & Rollen

Zwei Rollen steuern, wer Änderungen vornehmen darf:

| Rolle | Lesen | Schreiben / Löschen |
|-------|-------|---------------------|
| **EDITOR** | ✓ | ✓ |
| **VIEWER** | ✓ | — |

- Nutzer anlegen, Rollen ändern und Nutzer löschen (nur für EDITOR)
- Rollenbadge in der Navigation sichtbar
- Registrierung per E-Mail + Passwort; JWT Access Token (15 min) + Refresh Token (7 Tage)

### API-Dokumentation (OpenAPI / Swagger)

Die komplette REST-API ist als OpenAPI 3.0.3-Spec dokumentiert und per Swagger UI interaktiv erreichbar:

- **Swagger UI:** `http://localhost:4000/api/docs/`
- **OpenAPI JSON** (für Code-Generatoren): `http://localhost:4000/api/docs.json`

---

## Quickstart

### Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inkl. Docker Compose v2)

### Schritte

```bash
# 1. Repository klonen
git clone <repo-url>
cd home-inventory

# 2. Umgebungsvariablen anlegen und anpassen
cp .env.example .env
# DB_PASSWORD, JWT_SECRET und JWT_REFRESH_SECRET setzen!

# 3. Container bauen und starten
docker compose up -d --build

# 4. Testdaten einspielen (erstellt zwei Demo-Nutzer)
docker compose exec backend sh -c "npx prisma db seed"

# 5. App aufrufen
open http://localhost:3000
```

**Demo-Zugänge nach dem Seed:**

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| EDITOR | `test@home.local` | `test1234` |
| VIEWER | `viewer@home.local` | `test1234` |

> Das Backend führt beim Start automatisch `prisma db push` aus und synchronisiert das Schema mit der Datenbank.

---

## Lokale Entwicklung

Für die Entwicklung werden Backend und Frontend separat gestartet. Die Datenbank läuft per Docker.

### 1. Datenbank starten

```bash
docker compose up postgres -d
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # Werte anpassen

# Datenbank-Schema anwenden
npx prisma db push

# Testdaten einspielen
npm run db:seed

# Entwicklungsserver starten (Hot-Reload)
npm run dev
# → http://localhost:4000
# → Swagger UI: http://localhost:4000/api/docs/
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

> Im Dev-Modus proxied Vite `/api/*` und `/uploads/*` automatisch an `localhost:4000`.

### Nützliche Backend-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver mit Hot-Reload |
| `npm run build` | TypeScript kompilieren |
| `npm test` | Unit-Tests einmalig ausführen |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run test:coverage` | Tests mit Coverage-Report |
| `npm run lint` | ESLint ausführen |
| `npm run format` | Prettier auf `src/` anwenden |
| `npm run db:seed` | Testdaten einspielen |
| `npm run db:studio` | Prisma Studio im Browser öffnen |

### Nützliche Frontend-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Vite Dev-Server |
| `npm run build` | Produktions-Build erstellen |
| `npm test` | Unit-Tests einmalig ausführen |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run test:coverage` | Tests mit Coverage-Report |
| `npm run lint` | ESLint ausführen |
| `npm run format` | Prettier auf `src/` anwenden |

---

## Tests

Das Projekt verwendet **Vitest** für Backend (Node-Umgebung) und Frontend (jsdom-Umgebung).

### Alle Tests ausführen

```bash
# Einmalig (Backend + Frontend)
bash scripts/test.sh

# Mit Coverage-Reports
bash scripts/test.sh --coverage
```

### Separat

```bash
cd backend && npm test
cd frontend && npm test
```

### Übersicht Test-Abdeckung

| Bereich | Test-Datei | Was wird getestet |
|---------|-----------|-------------------|
| Backend | `jwt.test.ts` | Token signieren & verifizieren, Rollen-Roundtrip |
| Backend | `auth.middleware.test.ts` | `authenticate` + `requireEditor` Middleware |
| Backend | `errorHandler.test.ts` | ZodError → 400, generische Fehler → 500 |
| Backend | `auth.routes.test.ts` | Register, Login, Refresh-Token |
| Backend | `rooms.routes.test.ts` | CRUD Räume |
| Backend | `users.routes.test.ts` | CRUD Nutzer, Rollen-Management |
| Backend | `items.routes.test.ts` | Suche, Low-Stock, CRUD, purchaseUrl-Clearing |
| Backend | `containerTypes.routes.test.ts` | CRUD Container-Typen, Farbvalidierung |
| Backend | `lendings.routes.test.ts` | Verleihen, Rückgabe, Doppelrückgabe (409), Historie |
| Backend | `tags.routes.test.ts` | Tags auflisten |
| Backend | `openapi.test.ts` | Spec-Struktur, alle Pfade und Schemas vorhanden |
| Frontend | `AuthContext.test.tsx` | Login, Logout, Register, localStorage |
| Frontend | `PrivateRoute.test.tsx` | Redirect ohne Session, Inhalt mit Session |
| Frontend | `types.test.ts` | `CONDITION_LABELS` und `CONDITION_COLORS` |

---

## Umgebungsvariablen

### Stamm `.env` (Docker Compose)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `DB_PASSWORD` | `changeme` | PostgreSQL-Passwort. **In Produktion unbedingt ändern.** |
| `JWT_SECRET` | `changeme_jwt_secret_please` | Secret für Access Tokens (min. 32 Zeichen empfohlen). |
| `JWT_REFRESH_SECRET` | `changeme_refresh_secret_please` | Secret für Refresh Tokens. **Muss sich von `JWT_SECRET` unterscheiden.** |
| `PORT` | `3000` | Öffentlicher Port, auf dem Nginx lauscht. |

### Backend `backend/.env` (lokale Entwicklung)

| Variable | Beispiel | Beschreibung |
|----------|---------|--------------|
| `DATABASE_URL` | `postgresql://inventory:pw@localhost:5432/home_inventory` | Prisma-Connection-URL |
| `JWT_SECRET` | — | Wie oben |
| `JWT_REFRESH_SECRET` | — | Wie oben |
| `UPLOAD_DIR` | `./uploads` | Verzeichnis für hochgeladene Bilder |
| `PORT` | `4000` | Port des Express-Servers |

> **Sicherheitshinweis:** `.env` ist in `.gitignore` eingetragen und wird nie ins Repository eingecheckt.

---

## Projektstruktur

```
home-inventory/
├── .env.example                  Vorlage für Umgebungsvariablen
├── .gitignore
├── docker-compose.yml            Orchestrierung aller Services
├── nginx/
│   └── nginx.conf                Reverse-Proxy-Konfiguration
├── scripts/
│   └── test.sh                   Test-Runner für Backend + Frontend
│
├── backend/
│   ├── Dockerfile                Multi-Stage Build
│   ├── package.json
│   ├── vitest.config.ts          Test-Konfiguration (Node-Umgebung)
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma         Datenmodell
│   │   └── seed.ts               Demo-Daten (EDITOR + VIEWER)
│   └── src/
│       ├── index.ts              Express-App, Router-Registrierung, Swagger UI
│       ├── openapi.ts            OpenAPI 3.0.3-Spezifikation
│       ├── lib/
│       │   └── prisma.ts         Prisma-Client Singleton
│       ├── middleware/
│       │   ├── auth.ts           JWT-Verifikation + requireEditor
│       │   └── errorHandler.ts   Globaler Fehler-Handler
│       ├── routes/
│       │   ├── auth.ts           POST /register, /login, /refresh
│       │   ├── rooms.ts          CRUD Räume
│       │   ├── locations.ts      CRUD Locations + Items anlegen
│       │   ├── items.ts          CRUD Items + Bildupload + Suche
│       │   ├── lendings.ts       Verleihen, Rückgabe, Historie
│       │   ├── tags.ts           Tags auflisten
│       │   ├── containerTypes.ts CRUD Container-Typen
│       │   └── users.ts          CRUD Nutzer + Rollen
│       ├── utils/
│       │   ├── jwt.ts            Token signieren & verifizieren
│       │   └── upload.ts         Multer-Konfiguration
│       └── __tests__/            Unit-Tests (11 Dateien)
│
└── frontend/
    ├── Dockerfile                Multi-Stage Build (Vite + Nginx)
    ├── vite.config.ts            Dev-Proxy + Vitest-Konfiguration
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx               Route-Definitionen
        ├── types.ts              TypeScript-Interfaces
        ├── api/                  API-Funktionen (axios)
        │   ├── client.ts         Axios + Token-Refresh-Interceptor
        │   ├── auth.ts
        │   ├── rooms.ts
        │   ├── locations.ts
        │   ├── items.ts
        │   ├── lendings.ts
        │   ├── containerTypes.ts
        │   └── users.ts
        ├── contexts/
        │   └── AuthContext.tsx   User-State, Login/Logout/Register
        ├── components/
        │   ├── Layout.tsx        Navigation + Rollenbadge
        │   ├── PrivateRoute.tsx  Auth-Guard
        │   └── Spinner.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── RoomsPage.tsx
        │   ├── RoomDetailPage.tsx
        │   ├── LocationDetailPage.tsx
        │   ├── ItemDetailPage.tsx  (inkl. Bearbeitungsformular)
        │   ├── SearchPage.tsx
        │   ├── LendingsPage.tsx
        │   ├── ContainerTypesPage.tsx
        │   └── UsersPage.tsx       Benutzerverwaltung
        └── __tests__/            Unit-Tests (3 Dateien)
```

---

## Technische Dokumentation

### Systemarchitektur

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP :3000
┌──────────────────────────▼──────────────────────────────┐
│                    Nginx (Alpine)                        │
│  /api/*      → proxy  backend:4000                      │
│  /uploads/*  → alias  /app/uploads  (Cache 30d)         │
│  /*          → proxy  frontend:80                       │
└───────┬──────────────────────────────────┬──────────────┘
        │ :4000                            │ :80
┌───────▼──────────┐              ┌────────▼─────────────┐
│  Backend         │              │  Frontend             │
│  Node.js/Express │              │  React SPA (Vite)     │
│  JWT Auth        │              │  Tailwind CSS         │
│  Prisma ORM      │              │  TanStack Query       │
│  Multer Upload   │              │  React Router v6      │
│  Swagger UI      │              └──────────────────────┘
└───────┬──────────┘
        │
┌───────▼──────────┐
│  PostgreSQL 16   │
│  (Docker Volume) │
└──────────────────┘
```

---

### Datenmodell

Das vollständige Schema liegt in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

#### User

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | Primärschlüssel |
| `email` | `String` | Eindeutig, Login-Identifier |
| `passwordHash` | `String` | bcrypt-Hash (Rounds: 12) |
| `name` | `String?` | Anzeigename (optional) |
| `role` | `UserRole` | `EDITOR` oder `VIEWER` (Standard: `EDITOR`) |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

#### ContainerType

Benutzerdefinierter Typ für Container (z. B. Schublade, Karton). Wird von allen Nutzern geteilt.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | Primärschlüssel |
| `name` | `String` | Name (global eindeutig) |
| `icon` | `String?` | Emoji oder Icon-Name |
| `color` | `String?` | Hex-Farbe (z. B. `#3B82F6`) |

> Wird ein Typ gelöscht, verlieren zugeordnete Locations ihren Typ (`onDelete: SetNull`).

#### Room

Geteilt zwischen allen Nutzern.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `name` | `String` | z. B. „Küche", „Keller" |
| `description` | `String?` | |
| `icon` | `String?` | Emoji |

Löschen eines Raums kaskadiert zu allen Locations und deren Items.

#### Location

Repräsentiert einen Container innerhalb eines Raums. Unterstützt beliebige Verschachtelung über `parentId`.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `name` | `String` | z. B. „Kühlschrank", „Oberes Fach" |
| `description` | `String?` | |
| `containerTypeId` | `String?` | → ContainerType |
| `roomId` | `String` | → Room |
| `parentId` | `String?` | → Location (Eltern-Container) |

#### Item

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `name` | `String` | |
| `description` | `String?` | |
| `quantity` | `Float` | Standard: 1 |
| `unit` | `String?` | z. B. „Stück", „Liter", „kg" |
| `minQuantity` | `Float?` | Schwellwert für Mindestbestand-Warnung |
| `condition` | `ItemCondition?` | `NEW` / `GOOD` / `WORN` / `BROKEN` |
| `imageUrl` | `String?` | Pfad unter `/uploads/` |
| `purchaseUrl` | `String?` | Kauflink |
| `purchasePrice` | `Float?` | Kaufpreis |
| `purchaseDate` | `DateTime?` | Kaufdatum |
| `warrantyUntil` | `DateTime?` | Garantie-Ablaufdatum |
| `serialNumber` | `String?` | Seriennummer |
| `barcode` | `String?` | EAN / QR-Code |
| `locationId` | `String` | → Location |

#### Lending

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `itemId` | `String` | → Item |
| `lentTo` | `String` | Name der ausleihenden Person |
| `lentAt` | `DateTime` | Ausleih-Datum (Standard: now) |
| `returnedAt` | `DateTime?` | Rückgabe-Datum; `null` = noch ausgeliehen |
| `note` | `String?` | Freie Notiz |

#### Beziehungsdiagramm

```
User (EDITOR/VIEWER)
                 │ verwaltet
Room ────────────< Location >──── ContainerType
                  Location ──< Location   (Verschachtelung)
                  Location ──< Item ──< Lending
                               Item ──< ItemTag >── Tag
```

---

### API-Dokumentation

Die vollständige, interaktive API-Dokumentation ist per **Swagger UI** erreichbar:

```
http://localhost:4000/api/docs/
```

Das rohe OpenAPI-JSON (für Client-Generatoren wie OpenAPI Generator, Speakeasy, etc.):

```
http://localhost:4000/api/docs.json
```

#### Schnellübersicht aller Endpunkte

Alle Endpunkte außer den Auth-Endpunkten erfordern `Authorization: Bearer <accessToken>`.  
Mit `🔒` markierte Endpunkte erfordern zusätzlich die Rolle **EDITOR**.

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| `GET` | `/api/health` | — | Server-Status |
| `POST` | `/api/auth/register` | — | Account registrieren |
| `POST` | `/api/auth/login` | — | Login |
| `POST` | `/api/auth/refresh` | — | Access Token erneuern |
| `GET` | `/api/users` | 🔒 | Alle Nutzer |
| `POST` | `/api/users` | 🔒 | Nutzer anlegen |
| `PUT` | `/api/users/:id/role` | 🔒 | Rolle ändern |
| `DELETE` | `/api/users/:id` | 🔒 | Nutzer löschen |
| `GET` | `/api/rooms` | ✓ | Alle Räume |
| `POST` | `/api/rooms` | 🔒 | Raum erstellen |
| `GET` | `/api/rooms/:id` | ✓ | Raum mit Locations |
| `PUT` | `/api/rooms/:id` | 🔒 | Raum bearbeiten |
| `DELETE` | `/api/rooms/:id` | 🔒 | Raum löschen |
| `GET` | `/api/rooms/:roomId/locations` | ✓ | Locations eines Raums |
| `POST` | `/api/rooms/:roomId/locations` | 🔒 | Location anlegen |
| `GET` | `/api/locations/:id` | ✓ | Location mit Items |
| `PUT` | `/api/locations/:id` | 🔒 | Location bearbeiten |
| `DELETE` | `/api/locations/:id` | 🔒 | Location löschen |
| `GET` | `/api/locations/:id/items` | ✓ | Items einer Location |
| `POST` | `/api/locations/:id/items` | 🔒 | Item anlegen |
| `GET` | `/api/items/search?q=` | ✓ | Volltextsuche (max. 50) |
| `GET` | `/api/items/low-stock` | ✓ | Items unter Mindestbestand |
| `GET` | `/api/items/:id` | ✓ | Item-Detail |
| `PUT` | `/api/items/:id` | 🔒 | Item bearbeiten |
| `DELETE` | `/api/items/:id` | 🔒 | Item löschen |
| `POST` | `/api/items/:id/image` | 🔒 | Bild hochladen |
| `GET` | `/api/tags` | ✓ | Alle Tags |
| `GET` | `/api/container-types` | ✓ | Alle Container-Typen |
| `POST` | `/api/container-types` | 🔒 | Typ anlegen |
| `PUT` | `/api/container-types/:id` | 🔒 | Typ bearbeiten |
| `DELETE` | `/api/container-types/:id` | 🔒 | Typ löschen |
| `GET` | `/api/lendings/active` | ✓ | Aktive Ausleihen |
| `GET` | `/api/lendings/:id` | ✓ | Einzelne Ausleihe |
| `PUT` | `/api/lendings/:id/return` | 🔒 | Rückgabe eintragen |
| `POST` | `/api/items/:id/lend` | 🔒 | Item verleihen |
| `GET` | `/api/items/:id/lendings` | ✓ | Verleihistorie |

#### Fehlerformat

```json
{ "error": "Fehlerbeschreibung" }
```

Validierungsfehler (HTTP 400) enthalten zusätzlich `details` mit dem Zod-Fehler-Array.

---

### Authentifizierung & Rollen

#### Token-Mechanismus

```
Login
  │
  ├── Access Token  (JWT, 15 min)   → Authorization: Bearer <token>
  └── Refresh Token (JWT, 7 Tage)   → POST /api/auth/refresh

Token abgelaufen?
  │
  ├── Frontend erkennt 401 via Axios-Interceptor
  ├── POST /api/auth/refresh → neuer Access Token
  └── Ursprünglicher Request wird automatisch wiederholt
```

#### Rollen

Die Rolle `EDITOR` oder `VIEWER` ist im Access Token eingebettet und wird bei jedem Request aus dem Token gelesen (kein DB-Lookup). Beim Refresh wird die aktuelle Rolle aus der DB geholt, damit Rollenänderungen sofort wirksam werden.

**Speicherung:** Tokens im `localStorage`. Für ein persönliches Heimnetzwerk-Tool akzeptabler Kompromiss.  
**Passwort-Hashing:** bcrypt mit Cost-Factor 12.

---

### Datei-Upload

Bilder werden über `POST /api/items/:id/image` hochgeladen (`multipart/form-data`, Feld: `image`).

- **Max. Dateigröße:** 10 MB
- **Erlaubte MIME-Types:** `image/*`
- **Dateiname:** 16 zufällige Hex-Bytes + Original-Erweiterung
- **Speicherort:** `UPLOAD_DIR` (Standard: `./uploads`, in Docker: `/app/uploads`)
- **Nginx:** Serviert Uploads direkt unter `/uploads/*` mit `Cache-Control: public, immutable, max-age=30d`

Wird ein Item gelöscht oder ein neues Bild hochgeladen, wird die alte Datei automatisch entfernt.

---

### Prisma & Schema

Das Schema liegt in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) und ist die **single source of truth** für das Datenbankschema.

```bash
# Schema auf Datenbank anwenden (development, kein Migrations-File)
npx prisma db push

# Prisma Client nach Schema-Änderung regenerieren
npx prisma generate

# Datenbank interaktiv anschauen
npx prisma studio
```

#### Seed-Daten

```bash
cd backend
npm run db:seed
```

Erstellt:
- **EDITOR:** `test@home.local` / `test1234`
- **VIEWER:** `viewer@home.local` / `test1234`
- 5 Räume, 5 Container-Typen, 12 Container, 15 Gegenstände, 6 Tags, 2 Ausleihen

> **Achtung:** Der Seed löscht alle vorhandenen Daten.

---

## Docker-Deployment

### Services

| Service | Image | Port (intern) | Beschreibung |
|---------|-------|---------------|--------------|
| `postgres` | `postgres:16-alpine` | 5432 | Datenbank mit persistentem Volume |
| `backend` | Lokaler Build | 4000 | Express API + Swagger UI |
| `frontend` | Lokaler Build | 80 | React SPA (Nginx) |
| `nginx` | `nginx:alpine` | **3000** (öffentlich) | Reverse Proxy |

### Volumes

| Volume | Inhalt |
|--------|--------|
| `postgres_data` | PostgreSQL-Datenbankdateien |
| `uploads` | Hochgeladene Bilder |

### Deployment-Befehle

```bash
# Images neu bauen und starten
docker compose up -d --build

# Logs anschauen
docker compose logs -f backend

# Nur Backend neu starten
docker compose restart backend

# Alles stoppen
docker compose down

# Alles stoppen inkl. Volumes (löscht alle Daten!)
docker compose down -v
```

---

## Code-Qualität

### Linting & Formatting

```bash
# Backend
cd backend && npm run lint && npm run format

# Frontend
cd frontend && npm run lint && npm run format
```

### Validierung

Das Backend verwendet **Zod** für alle eingehenden Requests:

```json
{
  "error": "Validierungsfehler",
  "details": [{ "path": ["email"], "message": "Invalid email" }]
}
```
