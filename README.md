# Home Inventory

Webanwendung zur vollständigen Verwaltung von Haushaltsgegenständen — was liegt wo, in welcher Menge, mit Fotos, Kaufinformationen und Verleihistorie.

---

## Inhaltsverzeichnis

1. [Features](#features)
2. [Quickstart](#quickstart)
3. [Lokale Entwicklung](#lokale-entwicklung)
4. [Umgebungsvariablen](#umgebungsvariablen)
5. [Projektstruktur](#projektstruktur)
6. [Technische Dokumentation](#technische-dokumentation)
   - [Systemarchitektur](#systemarchitektur)
   - [Datenmodell](#datenmodell)
   - [API-Referenz](#api-referenz)
   - [Authentifizierung](#authentifizierung)
   - [Datei-Upload](#datei-upload)
   - [Prisma & Migrationen](#prisma--migrationen)
7. [Docker-Deployment](#docker-deployment)
8. [Code-Qualität](#code-qualität)

---

## Features

### Inventarverwaltung

- Hierarchische Struktur: **Raum → Container → Gegenstand**
- Container beliebig tief verschachtelbar (Schrank → Schublade → Box)
- Benutzerdefinierte **Container-Typen** mit Emoji und Farbe
- Volltextsuche über Name, Beschreibung, Seriennummer und Barcode
- Mindestbestand-Warnung auf dem Dashboard

### Gegenstände

- Name, Beschreibung, Menge und Einheit
- Foto-Upload (JPEG, PNG, WebP — max. 10 MB)
- Zustand: Neu / Gut / Abgenutzt / Defekt
- Tags zur freien Kategorisierung (Mehrfachzuordnung)
- Mindestbestand-Schwellwert

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

### Authentifizierung
- Registrierung und Login per E-Mail + Passwort
- JWT Access Token (15 min) + Refresh Token (7 Tage)
- Automatische Token-Erneuerung im Frontend

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

# 3. Sichere Werte in .env setzen (Pflicht!)
#    DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# 4. Container starten (baut Images beim ersten Mal automatisch)
docker compose up -d

# 5. App aufrufen
open http://localhost:3000
```

> Beim ersten Start führt der Backend-Container automatisch alle Prisma-Migrationen aus (`prisma migrate deploy`).

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

# Abhängigkeiten installieren
npm install

# .env anlegen (Vorlage liegt unter backend/.env.example)
cp .env.example .env

# Datenbank-Schema anwenden
npm run db:migrate

# Testdaten einspielen
npm run db:seed

# Entwicklungsserver starten (Hot-Reload via tsx watch)
npm run dev
# → http://localhost:4000
```

### 3. Frontend

```bash
cd frontend

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (Vite mit Proxy zu localhost:4000)
npm run dev
# → http://localhost:5173
```

> Im Dev-Modus proxied Vite `/api/*` und `/uploads/*` automatisch an `localhost:4000`. Es ist keine weitere Konfiguration nötig.

### Nützliche Backend-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver mit Hot-Reload |
| `npm run build` | TypeScript kompilieren |
| `npm run lint` | ESLint ausführen |
| `npm run format` | Prettier auf `src/` anwenden |
| `npm run db:migrate` | Neue Migration erstellen und anwenden |
| `npm run db:seed` | Testdaten einspielen (löscht vorhandene Daten) |
| `npm run db:studio` | Prisma Studio im Browser öffnen |

### Nützliche Frontend-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Vite Dev-Server |
| `npm run build` | Produktions-Build erstellen |
| `npm run lint` | ESLint ausführen |
| `npm run format` | Prettier auf `src/` anwenden |

---

## Umgebungsvariablen

Die Datei `.env.example` enthält alle verfügbaren Variablen. Für den Start muss `.env` im Projektstamm existieren.

### Stamm `.env` (Docker Compose)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `DB_PASSWORD` | `changeme` | PostgreSQL-Passwort. **In Produktion unbedingt ändern.** |
| `JWT_SECRET` | `changeme_jwt_secret_please` | Secret für Access Tokens (min. 32 zufällige Zeichen empfohlen). |
| `JWT_REFRESH_SECRET` | `changeme_refresh_secret_please` | Secret für Refresh Tokens. **Muss sich von `JWT_SECRET` unterscheiden.** |
| `PORT` | `3000` | Öffentlicher Port, auf dem Nginx lauscht. |

### Backend `backend/.env` (lokale Entwicklung)

| Variable | Beispiel | Beschreibung |
|----------|---------|--------------|
| `DATABASE_URL` | `postgresql://inventory:pw@localhost:5432/home_inventory` | Vollständige Prisma-Connection-URL. |
| `JWT_SECRET` | — | Wie oben. |
| `JWT_REFRESH_SECRET` | — | Wie oben. |
| `UPLOAD_DIR` | `./uploads` | Verzeichnis für hochgeladene Bilder. |
| `PORT` | `4000` | Port des Express-Servers. |

> **Sicherheitshinweis:** Die `.env`-Datei ist in `.gitignore` eingetragen und wird nie ins Repository eingecheckt.

---

## Projektstruktur

```
home-inventory/
├── .env.example                  Vorlage für Umgebungsvariablen
├── .gitignore
├── docker-compose.yml            Orchestrierung aller Services
├── nginx/
│   └── nginx.conf                Reverse-Proxy-Konfiguration
│
├── backend/
│   ├── Dockerfile                Multi-Stage Build (Builder + Runtime)
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── .prettierrc
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma         Datenmodell (single source of truth)
│   │   ├── migrations/           Versionierte SQL-Migrationen
│   │   └── seed.ts               Testdaten-Skript
│   └── src/
│       ├── index.ts              Express-App + Router-Registrierung
│       ├── lib/
│       │   └── prisma.ts         Prisma-Client Singleton
│       ├── middleware/
│       │   ├── auth.ts           JWT-Verifikation (Bearer Token)
│       │   └── errorHandler.ts   Globaler Fehler-Handler (Zod + 500er)
│       ├── routes/
│       │   ├── auth.ts           POST /register, /login, /refresh
│       │   ├── rooms.ts          CRUD Räume + Locations anlegen
│       │   ├── locations.ts      CRUD Locations + Items anlegen
│       │   ├── items.ts          CRUD Items + Bildupload + Suche
│       │   ├── lendings.ts       Verleihen, Rückgabe, Historie
│       │   ├── tags.ts           Tags auflisten
│       │   └── containerTypes.ts CRUD Container-Typen
│       └── utils/
│           ├── jwt.ts            Token signieren & verifizieren
│           └── upload.ts         Multer-Konfiguration
│
└── frontend/
    ├── Dockerfile                Multi-Stage Build (Vite + Nginx)
    ├── nginx.conf                SPA-Routing (try_files)
    ├── package.json
    ├── vite.config.ts            Dev-Proxy zu Backend
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── eslint.config.mjs
    ├── .prettierrc
    └── src/
        ├── main.tsx              Root: QueryClient + Router + AuthProvider
        ├── App.tsx               Route-Definitionen
        ├── index.css             Tailwind-Imports
        ├── types.ts              Gemeinsame TypeScript-Interfaces
        ├── api/                  API-Funktionen (axios)
        │   ├── client.ts         Axios-Instanz mit Token-Refresh-Interceptor
        │   ├── auth.ts
        │   ├── rooms.ts
        │   ├── locations.ts
        │   ├── items.ts
        │   ├── lendings.ts
        │   └── containerTypes.ts
        ├── contexts/
        │   └── AuthContext.tsx   User-State, Login/Logout
        ├── components/
        │   ├── Layout.tsx        Sidebar-Navigation
        │   ├── PrivateRoute.tsx  Auth-Guard
        │   └── Spinner.tsx       Lade-Indikator
        └── pages/
            ├── LoginPage.tsx
            ├── DashboardPage.tsx
            ├── RoomsPage.tsx
            ├── RoomDetailPage.tsx
            ├── LocationDetailPage.tsx
            ├── ItemDetailPage.tsx
            ├── SearchPage.tsx
            ├── LendingsPage.tsx
            └── ContainerTypesPage.tsx
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
│                                                         │
│  /api/*      → proxy  backend:4000                      │
│  /uploads/*  → alias  /app/uploads  (Cache 30d)         │
│  /*          → proxy  frontend:80                       │
└───────┬──────────────────────────────────┬──────────────┘
        │ :4000                            │ :80
┌───────▼──────────┐              ┌────────▼─────────────┐
│  Backend         │              │  Frontend             │
│  Node.js/Express │              │  React SPA (Vite)     │
│                  │              │  Tailwind CSS         │
│  JWT Auth        │              │  TanStack Query       │
│  Prisma ORM      │              │  React Router v6      │
│  Multer Upload   │              └──────────────────────┘
└───────┬──────────┘
        │
┌───────▼──────────┐
│  PostgreSQL 16   │
│  (persistentes   │
│   Docker Volume) │
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
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

#### ContainerType

Benutzerdefinierter Typ für Container (z. B. Schublade, Karton).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | Primärschlüssel |
| `name` | `String` | Name (eindeutig pro User) |
| `icon` | `String?` | Emoji oder Icon-Name |
| `color` | `String?` | Hex-Farbe (z. B. `#FF5733`) |
| `userId` | `String` | Fremdschlüssel → User |

> Wird ein Typ gelöscht, verlieren zugeordnete Locations ihren Typ (`onDelete: SetNull`).

#### Room

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `name` | `String` | z. B. „Küche", „Keller" |
| `description` | `String?` | |
| `icon` | `String?` | Emoji |
| `userId` | `String` | Fremdschlüssel → User |

Löschen eines Raums kaskadiert zu allen Locations und deren Items.

#### Location

Repräsentiert einen Container innerhalb eines Raums (Schrank, Regal, Box, ...). Unterstützt beliebige Verschachtelung über `parentId`.

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

#### Beziehungsdiagramm (vereinfacht)

```
User ──< Room ──< Location >──── ContainerType
               Location ──< Location   (Verschachtelung)
               Location ──< Item ──< Lending
                            Item ──< ItemTag >── Tag
```

---

### API-Referenz

Alle Endpunkte unterhalb von `/api/auth/` sind öffentlich. Alle anderen erfordern einen gültigen **Bearer Token** im `Authorization`-Header.

#### Authentifizierung

| Methode | Pfad | Body | Antwort |
|---------|------|------|---------|
| `POST` | `/api/auth/register` | `{ email, password, name? }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |

#### Räume

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/rooms` | Alle Räume des eingeloggten Users |
| `POST` | `/api/rooms` | Raum erstellen |
| `GET` | `/api/rooms/:id` | Raum mit Location-Baum |
| `PUT` | `/api/rooms/:id` | Raum aktualisieren |
| `DELETE` | `/api/rooms/:id` | Raum löschen (kaskadierend) |
| `GET` | `/api/rooms/:roomId/locations` | Top-Level Locations eines Raums |
| `POST` | `/api/rooms/:roomId/locations` | Location in Raum erstellen |

**POST `/api/rooms`**
```json
{ "name": "Küche", "icon": "🍳", "description": "..." }
```

**POST `/api/rooms/:roomId/locations`**
```json
{ "name": "Kühlschrank", "containerTypeId": "...", "parentId": "..." }
```

#### Locations

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/locations/:id` | Location mit Kindern und Items |
| `PUT` | `/api/locations/:id` | Location aktualisieren |
| `DELETE` | `/api/locations/:id` | Location löschen (kaskadierend) |
| `GET` | `/api/locations/:locationId/items` | Alle Items einer Location |
| `POST` | `/api/locations/:locationId/items` | Item in Location erstellen |

**POST `/api/locations/:locationId/items`**
```json
{
  "name": "Tomatendosen",
  "quantity": 6,
  "unit": "Dose",
  "minQuantity": 3,
  "condition": "NEW",
  "purchaseUrl": "https://...",
  "purchasePrice": 1.49,
  "warrantyUntil": "2026-12-31",
  "serialNumber": "...",
  "barcode": "4000539012121",
  "tags": ["Lebensmittel"]
}
```

#### Items

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/items/search?q=...` | Volltext-Suche (max. 50 Ergebnisse) |
| `GET` | `/api/items/low-stock` | Items unter Mindestbestand |
| `GET` | `/api/items/:id` | Item mit Tags, Lendings und Location |
| `PUT` | `/api/items/:id` | Item aktualisieren (inkl. Tags ersetzen) |
| `DELETE` | `/api/items/:id` | Item löschen (Bild wird mitgelöscht) |
| `POST` | `/api/items/:id/image` | Bild hochladen (`multipart/form-data`, Feld: `image`) |

Suche durchsucht: `name`, `description`, `serialNumber` (contains) und `barcode` (exact match).

#### Ausleihen (Lendings)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/lendings/active` | Alle aktuell ausgeliehenen Items |
| `GET` | `/api/lendings/:id` | Einzelne Ausleihe |
| `POST` | `/api/lendings/items/:itemId/lend` | Item verleihen |
| `PUT` | `/api/lendings/:id/return` | Rückgabe eintragen (setzt `returnedAt = now`) |
| `GET` | `/api/lendings/items/:itemId/lendings` | Verleihistorie eines Items |

**POST `/api/lendings/items/:itemId/lend`**
```json
{ "lentTo": "Peter Müller", "note": "Für Renovierung", "lentAt": "2026-06-01" }
```

#### Container-Typen

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/container-types` | Alle Typen des Users |
| `POST` | `/api/container-types` | Typ erstellen |
| `PUT` | `/api/container-types/:id` | Typ aktualisieren |
| `DELETE` | `/api/container-types/:id` | Typ löschen |

**POST `/api/container-types`**
```json
{ "name": "Schublade", "icon": "🗄️", "color": "#4F46E5" }
```

#### Tags

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/tags` | Alle Tags des Users (mit Item-Anzahl) |

Tags werden automatisch erstellt, wenn sie beim Anlegen/Aktualisieren eines Items übergeben werden.

#### Fehlerformat

Alle Fehlerantworten folgen diesem Schema:

```json
{ "error": "Fehlerbeschreibung auf Deutsch" }
```

Validierungsfehler (HTTP 400) enthalten zusätzlich `details` mit dem Zod-Fehler-Array.

---

### Authentifizierung

Das System verwendet ein **Dual-Token-Verfahren**:

```
Login
  │
  ├── Access Token  (JWT, 15 min)   → wird bei jedem API-Request mitgesendet
  └── Refresh Token (JWT, 7 Tage)   → wird nur zum Erneuern des Access Tokens genutzt

Token abgelaufen?
  │
  ├── Frontend erkennt 401-Antwort via Axios-Interceptor
  ├── Sendet Refresh Token an POST /api/auth/refresh
  ├── Erhält neuen Access Token
  └── Wiederholt den ursprünglichen Request automatisch
```

**Speicherung:** Beide Tokens werden im `localStorage` gespeichert. Für ein persönliches Heimnetzwerk-Tool ist das ein akzeptabler Kompromiss gegenüber httpOnly-Cookies.

**Passwort-Hashing:** bcrypt mit Cost-Factor 12 (`bcryptjs`).

---

### Datei-Upload

Bilder werden über `POST /api/items/:id/image` hochgeladen (`multipart/form-data`, Feld-Name: `image`).

- **Maximale Dateigröße:** 10 MB (Multer-Limit)
- **Erlaubte MIME-Types:** `image/*`
- **Dateinamen:** 16 zufällige Hex-Bytes + Original-Erweiterung (z. B. `a3f8c1...d2.jpg`)
- **Speicherort:** `UPLOAD_DIR` (Standard: `./uploads`, in Docker: `/app/uploads`)
- **Nginx:** Serviert Uploads direkt unter `/uploads/*` mit `Cache-Control: public, immutable, max-age=30d`

Wird ein Item gelöscht oder ein neues Bild hochgeladen, wird die alte Datei automatisch vom Dateisystem entfernt.

---

### Prisma & Migrationen

#### Was sind Migrationen?

Jede Änderung am Schema (`schema.prisma`) erzeugt ein SQL-Skript unter `backend/prisma/migrations/`. Diese Skripte werden versioniert (Git) und auf jedem Environment exakt in der gleichen Reihenfolge eingespielt — damit ist die Datenbankstruktur jederzeit reproduzierbar.

#### Wichtige Befehle

```bash
# Neue Migration erstellen (Entwicklung)
npx prisma migrate dev --name beschreibung_der_aenderung

# Migrationen auf Produktion anwenden (kein Schema-Diff, nur bestehende Migrationen ausführen)
npx prisma migrate deploy

# Prisma Client nach Schema-Änderung neu generieren
npx prisma generate

# Datenbank interaktiv anschauen
npx prisma studio
```

#### Seed-Daten

Das Seed-Skript (`backend/prisma/seed.ts`) legt einen Demo-Nutzer mit vollständigen Beispieldaten an:

- **Login:** `test@home.local` / `test1234`
- 5 Räume (Küche, Wohnzimmer, Keller, Badezimmer, Schlafzimmer)
- 5 Container-Typen (Schublade, Schrank, Regal, Box, Karton)
- 12 Container (mit Verschachtelung im Keller)
- 15 Gegenstände (Lebensmittel, Elektronik, Werkzeug, Kleidung, Medizin)
- 6 Tags
- 2 Ausleihen (1 aktiv, 1 zurückgegeben)

> **Achtung:** Der Seed löscht alle vorhandenen Daten vor dem Einspielen.

```bash
cd backend
npm run db:seed
```

---

## Docker-Deployment

### Services

| Service | Image | Port (intern) | Beschreibung |
|---------|-------|---------------|--------------|
| `postgres` | `postgres:16-alpine` | 5432 | Datenbank mit persistentem Volume |
| `backend` | Lokaler Build | 4000 | Express API + Prisma |
| `frontend` | Lokaler Build | 80 | React SPA (Nginx) |
| `nginx` | `nginx:alpine` | **3000** (öffentlich) | Reverse Proxy |

### Volumes

| Volume | Inhalt |
|--------|--------|
| `postgres_data` | PostgreSQL-Datenbankdateien |
| `uploads` | Hochgeladene Bilder (shared zwischen Backend und Nginx) |

### Deployment-Ablauf

```bash
# Images neu bauen und starten
docker compose up -d --build

# Logs anschauen
docker compose logs -f backend

# Nur Backend neu starten
docker compose restart backend

# Alles stoppen
docker compose down

# Alles stoppen + Volumes löschen (Achtung: löscht alle Daten!)
docker compose down -v
```

### Backend-Dockerfile (Multi-Stage)

```
Stage 1 (builder):  npm ci → prisma generate → tsc
Stage 2 (runtime):  Node.js Alpine + dist/ + node_modules + prisma/
                    CMD: prisma migrate deploy && node dist/index.js
```

### Frontend-Dockerfile (Multi-Stage)

```
Stage 1 (builder):  npm ci → vite build → dist/
Stage 2 (runtime):  Nginx Alpine + dist/ + nginx.conf (SPA-Routing)
```

---

## Code-Qualität

### Linting & Formatting

Beide Teilprojekte verwenden **ESLint** (Flat Config, v9) und **Prettier**.

```bash
# Backend
cd backend && npm run lint && npm run format

# Frontend
cd frontend && npm run lint && npm run format
```

### Konfigurationsdateien

| Datei | Zweck |
|-------|-------|
| `eslint.config.mjs` | ESLint-Regeln (TypeScript + Prettier-Kompatibilität) |
| `.prettierrc` | `singleQuote: true`, `trailingComma: all`, `printWidth: 100` |

### Validierung

Das Backend verwendet **Zod** für alle eingehenden Requests. Validierungsfehler werden vom globalen Error-Handler als strukturiertes JSON zurückgegeben:

```json
{
  "error": "Validierungsfehler",
  "details": [
    { "path": ["email"], "message": "Invalid email" }
  ]
}
```
