# Technische Dokumentation — Home Inventory

Betrieb und Quickstart: [README.md](README.md)

---

## Inhalt

1. [Projektstruktur](#projektstruktur)
2. [Systemarchitektur](#systemarchitektur)
3. [Datenmodell](#datenmodell)
4. [API-Dokumentation](#api-dokumentation)
5. [Authentifizierung & Rollen](#authentifizierung--rollen)
6. [Internationalisierung (i18n)](#internationalisierung-i18n)
7. [Datei-Upload](#datei-upload)
8. [Prisma & Schema](#prisma--schema)
9. [Tests](#tests)
10. [Code-Qualität](#code-qualität)

---

## Projektstruktur

```text
home-inventory/
├── .env.example
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── scripts/
│   └── test.sh                   Backend + Frontend Tests kombiniert
│
├── backend/
│   ├── Dockerfile                Multi-Stage Build
│   ├── prisma.config.ts          Prisma 7 CLI-Datasource-Config (DATABASE_URL)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts               Demo-Daten (EDITOR + VIEWER + Units + Tags)
│   └── src/
│       ├── index.ts              Express-App, Router-Registrierung, Swagger UI
│       ├── openapi.ts            OpenAPI 3.0.3-Spezifikation
│       ├── lib/prisma.ts         PrismaClient mit PrismaPg-Adapter (pg.Pool)
│       ├── middleware/
│       │   ├── auth.ts           JWT-Verifikation + requireEditor
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── rooms.ts
│       │   ├── locations.ts
│       │   ├── items.ts          CRUD + Bildupload + Suche + Low-Stock
│       │   ├── lendings.ts
│       │   ├── tags.ts           Tag-CRUD (key + name)
│       │   ├── containerTypes.ts
│       │   ├── units.ts          Einheitenverwaltung (key + name)
│       │   └── users.ts
│       ├── utils/
│       │   ├── jwt.ts
│       │   └── upload.ts
│       └── __tests__/            13 Testdateien (124 Tests)
│
└── frontend/
    └── src/
        ├── main.tsx              i18n-Import hier (vor Render)
        ├── App.tsx
        ├── types.ts
        ├── i18n/
        │   ├── config.ts         i18next-Init, localStorage-Persistenz
        │   └── locales/
        │       ├── de.json       Deutsch (Standard)
        │       └── en.json       Englisch
        ├── api/
        │   ├── client.ts         Axios + Token-Refresh-Interceptor
        │   ├── auth.ts
        │   ├── rooms.ts
        │   ├── locations.ts
        │   ├── items.ts
        │   ├── lendings.ts
        │   ├── containerTypes.ts
        │   ├── tags.ts           Tag-API (getTags, createTag, updateTag, deleteTag)
        │   ├── units.ts
        │   └── users.ts
        ├── contexts/AuthContext.tsx
        ├── components/
        │   ├── Layout.tsx        Navigation, Rollenbadge, Sprachumschalter
        │   ├── PrivateRoute.tsx
        │   └── Spinner.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── RoomsPage.tsx
        │   ├── RoomDetailPage.tsx
        │   ├── LocationDetailPage.tsx
        │   ├── ItemDetailPage.tsx    Tag-Picker (Chips) + Unit-Select
        │   ├── ItemsOverviewPage.tsx Tag-Filter + übersetzte Einheiten
        │   ├── SearchPage.tsx
        │   ├── LendingsPage.tsx
        │   ├── ContainerTypesPage.tsx
        │   ├── TagsPage.tsx      Tag-Verwaltung (EDITOR only)
        │   ├── UnitsPage.tsx     Einheitenverwaltung mit Key-Badge (EDITOR only)
        │   └── UsersPage.tsx
        └── __tests__/            3 Testdateien (12 Tests)
```

> **Tests gesamt:** 13 Backend-Testdateien (124 Tests) · 3 Frontend-Testdateien (12 Tests)

---

## Systemarchitektur

```text
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
│  Prisma 7 ORM    │              │  TanStack Query       │
│  Multer Upload   │              │  React Router v6      │
│  Swagger UI      │              │  react-i18next        │
└───────┬──────────┘              └──────────────────────┘
        │
┌───────▼──────────┐
│  PostgreSQL 16   │
│  (Docker Volume) │
└──────────────────┘
```

### Tech Stack

| Schicht | Technologie |
|---------|-------------|
| Backend | Node.js + TypeScript, Express.js |
| ORM | Prisma **7.8.0** + `@prisma/adapter-pg` |
| Datenbank | PostgreSQL 16 |
| Frontend | React + TypeScript, Vite |
| Styling | Tailwind CSS |
| State / Fetching | TanStack Query + React Router v6 |
| i18n | i18next + react-i18next |
| Auth | JWT (Access 15 min + Refresh 7 Tage), bcrypt 12 Rounds |
| Upload | Multer |
| Validierung | Zod |
| Tests | Vitest (Node-Env + jsdom) |
| API-Docs | OpenAPI 3.0.3, Swagger UI |

---

## Datenmodell

Schema: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

```text
User (role: EDITOR | VIEWER)

Unit  ← key (unique slug, z.B. "piece"), name (Anzeigename, z.B. "Stück")
Tag   ← key (unique slug, z.B. "tool"), name (Anzeigename, z.B. "Werkzeug")

Room  ← geteilt zwischen allen Usern
 └── Location (Container, beliebig tief verschachtelbar)
      ├── containerTypeId → ContainerType
      ├── parentId → Location
      └── Item
           ├── quantity / unit (Key-String, z.B. "piece") / minQuantity
           ├── condition (NEW / GOOD / WORN / BROKEN)
           ├── purchaseUrl / purchasePrice / purchaseDate
           ├── warrantyUntil / serialNumber / barcode
           ├── imageUrl
           ├── tags (ItemTag many-to-many, via tag.key)
           └── lendings (lentTo, lentAt, returnedAt, note)
```

### User

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `email` | `String` | eindeutig |
| `passwordHash` | `String` | bcrypt, 12 Rounds |
| `name` | `String?` | |
| `role` | `UserRole` | `EDITOR` oder `VIEWER` (Standard: `EDITOR`) |

### Room

Geteilt zwischen allen Nutzern. Löschen kaskadiert zu Locations und Items.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | z. B. „Küche" |
| `description` | `String?` | |
| `icon` | `String?` | Emoji |

### Location

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | |
| `containerTypeId` | `String?` | → ContainerType |
| `roomId` | `String` | → Room |
| `parentId` | `String?` | → Location (Eltern) |

### Item

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | |
| `description` | `String?` | |
| `quantity` | `Float` | Standard: 1 |
| `unit` | `String?` | Key einer Unit (z. B. `"piece"`, `"kg"`) |
| `minQuantity` | `Float?` | Schwellwert für Dashboard-Warnung |
| `condition` | `ItemCondition?` | NEW / GOOD / WORN / BROKEN |
| `imageUrl` | `String?` | |
| `purchaseUrl` | `String?` | |
| `purchasePrice` | `Float?` | |
| `purchaseDate` | `DateTime?` | |
| `warrantyUntil` | `DateTime?` | |
| `serialNumber` | `String?` | |
| `barcode` | `String?` | |
| `locationId` | `String` | → Location |

`Item.unit` speichert den **Key** der Unit-Tabelle (kein FK). Die Anzeige erfolgt über `t('unitNames.${unit}', { defaultValue: unit })`.

### Unit

Verwaltete Vorschlagsliste für `Item.unit`. Kein FK auf Item — bestehende Items sind von Änderungen unberührt.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `key` | `String` | eindeutiger Slug, z. B. `"piece"`, `"kg"` |
| `name` | `String` | eindeutiger Anzeigename, z. B. `"Stück"` |

### Tag

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `key` | `String` | eindeutiger Slug, z. B. `"food"`, `"tool"` |
| `name` | `String` | eindeutiger Anzeigename, z. B. `"Lebensmittel"` |
| `items` | `ItemTag[]` | m:n zu Item (Cascade Delete) |

Beim Löschen eines Tags werden alle zugehörigen `ItemTag`-Einträge kaskadiert gelöscht. Das Frontend warnt vor dem Löschen, wenn `_count.items > 0`.

### ContainerType

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | eindeutig |
| `icon` | `String?` | Emoji |
| `color` | `String?` | Hex-Farbe |

Wird ein Typ gelöscht, verlieren zugeordnete Locations ihren Typ (`onDelete: SetNull`).

### Lending

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `itemId` | `String` | → Item |
| `lentTo` | `String` | Name der ausleihenden Person |
| `lentAt` | `DateTime` | Standard: now() |
| `returnedAt` | `DateTime?` | null = noch ausgeliehen |
| `note` | `String?` | |

---

## API-Dokumentation

Interaktiv: `http://localhost:4000/api/docs/`
OpenAPI JSON (für Code-Generatoren): `http://localhost:4000/api/docs.json`

Alle Endpunkte außer Auth erfordern `Authorization: Bearer <accessToken>`.
🔒 = zusätzlich Rolle **EDITOR** erforderlich.

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
| `POST` | `/api/rooms` | 🔒 | Raum anlegen |
| `GET` | `/api/rooms/:id` | ✓ | Raum mit Locations |
| `PUT` | `/api/rooms/:id` | 🔒 | Raum bearbeiten |
| `DELETE` | `/api/rooms/:id` | 🔒 | Raum löschen |
| `GET` | `/api/rooms/:roomId/locations` | ✓ | Locations eines Raums |
| `POST` | `/api/rooms/:roomId/locations` | 🔒 | Location anlegen |
| `GET` | `/api/locations/:id` | ✓ | Location mit Unter-Containers |
| `PUT` | `/api/locations/:id` | 🔒 | Location bearbeiten |
| `DELETE` | `/api/locations/:id` | 🔒 | Location löschen |
| `GET` | `/api/locations/:id/items` | ✓ | Items einer Location |
| `POST` | `/api/locations/:id/items` | 🔒 | Item anlegen |
| `GET` | `/api/items` | ✓ | Alle Items mit Lagerort und Tags |
| `GET` | `/api/items/search?q=` | ✓ | Volltextsuche (max. 50) |
| `GET` | `/api/items/low-stock` | ✓ | Items unter Mindestbestand |
| `GET` | `/api/items/:id` | ✓ | Item-Detail |
| `PUT` | `/api/items/:id` | 🔒 | Item bearbeiten (inkl. `tags: string[]` Keys) |
| `DELETE` | `/api/items/:id` | 🔒 | Item löschen |
| `POST` | `/api/items/:id/image` | 🔒 | Bild hochladen |
| `POST` | `/api/items/:id/lend` | 🔒 | Item verleihen |
| `GET` | `/api/items/:id/lendings` | ✓ | Verleihistorie |
| `GET` | `/api/lendings/active` | ✓ | Aktive Ausleihen |
| `GET` | `/api/lendings/:id` | ✓ | Einzelne Ausleihe |
| `PUT` | `/api/lendings/:id/return` | 🔒 | Rückgabe eintragen |
| `GET` | `/api/tags` | ✓ | Alle Tags (inkl. `_count.items`) |
| `POST` | `/api/tags` | 🔒 | Tag anlegen (`key` + `name`) |
| `PUT` | `/api/tags/:id` | 🔒 | Tag bearbeiten |
| `DELETE` | `/api/tags/:id` | 🔒 | Tag löschen (kaskadiert ItemTags) |
| `GET` | `/api/container-types` | ✓ | Alle Container-Typen |
| `POST` | `/api/container-types` | 🔒 | Typ anlegen |
| `PUT` | `/api/container-types/:id` | 🔒 | Typ bearbeiten |
| `DELETE` | `/api/container-types/:id` | 🔒 | Typ löschen |
| `GET` | `/api/units` | ✓ | Alle Einheiten (inkl. `key`) |
| `POST` | `/api/units` | 🔒 | Einheit anlegen (`key` + `name`) |
| `PUT` | `/api/units/:id` | 🔒 | Einheit bearbeiten |
| `DELETE` | `/api/units/:id` | 🔒 | Einheit löschen |

### Tag- und Unit-Körper

```json
{ "key": "food", "name": "Lebensmittel" }
```

`key` muss dem Muster `/^[a-z][a-z0-9_]*$/` entsprechen (Zod-Validierung, max. 50 Zeichen). Doppelte Keys oder Namen werden mit `409 Conflict` abgelehnt.

### Items PUT — Tags setzen

```json
{ "tags": ["food", "medicine"] }
```

`tags` ist ein Array von Tag-Keys. Das Backend sucht die Tags per `findTagsByKeys` — nicht vorhandene Keys werden still ignoriert (kein auto-create).

### Fehlerformat

```json
{ "error": "Fehlerbeschreibung" }
```

Validierungsfehler (HTTP 400) enthalten zusätzlich `details` (Zod-Fehler-Array).

---

## Authentifizierung & Rollen

```text
Login
  ├── Access Token  (JWT, 15 min)  → Authorization: Bearer <token>
  └── Refresh Token (JWT, 7 Tage) → POST /api/auth/refresh

401 erkannt vom Axios-Interceptor → automatisch Refresh → Request wiederholen
```

Die Rolle ist im Access Token eingebettet (kein DB-Lookup bei jedem Request). Beim Refresh wird die Rolle frisch aus der DB gelesen — Rollenänderungen wirken daher spätestens nach 15 Minuten.

**Tokenspeicherung:** `localStorage` (akzeptabler Kompromiss für ein Heimnetz-Tool)
**Passwort-Hashing:** bcrypt, Cost-Factor 12

---

## Internationalisierung (i18n)

```text
frontend/src/i18n/
  config.ts           i18next-Init; liest localStorage('lang'), Fallback: 'de'
  locales/
    de.json           Deutsch (Standard)
    en.json           Englisch
```

**Namespaces:** `common`, `nav`, `login`, `dashboard`, `rooms`, `roomDetail`, `location`, `item`, `condition`, `search`, `lendings`, `containerTypes`, `units`, `tags`, `users`, `itemsOverview`, `tagNames`, `unitNames`

**Sprachumschalter:** Button in der Sidebar-Footer-Leiste. Speichert Auswahl in `localStorage('lang')`.

**Pluralformen:** i18next-Konvention `key_one` / `key_other` mit `t('key', { count })` — z. B. für Container- und Item-Zähler.

### Tags und Units übersetzen

Tags und Units besitzen einen technischen `key` (Slug) und einen `name` (Anzeigename/Fallback). In Templates:

```tsx
// Tag anzeigen
t(`tagNames.${tag.key}`, { defaultValue: tag.name })

// Einheit anzeigen
t(`unitNames.${item.unit}`, { defaultValue: item.unit })
```

Benutzerdefinierte Tags/Units, die nicht in den JSON-Dateien stehen, zeigen automatisch den Admin-Namen als Fallback.

---

## Datei-Upload

Upload via `POST /api/items/:id/image` (`multipart/form-data`, Feld `image`).

- Max. Dateigröße: **10 MB**
- Erlaubte MIME-Types: `image/*`
- Dateiname: 16 zufällige Hex-Bytes + Original-Erweiterung
- Speicherort: `UPLOAD_DIR` (Standard `./uploads`, Docker `/app/uploads`)
- Nginx serviert `/uploads/*` direkt mit `Cache-Control: public, immutable, max-age=30d`

Altes Bild wird beim Überschreiben oder Item-Löschen automatisch entfernt.

---

## Prisma & Schema

Prisma 7 hat gegenüber Prisma 5 Breaking Changes:

1. `datasource.url` steht nicht mehr in `schema.prisma`, sondern in [`backend/prisma.config.ts`](backend/prisma.config.ts):

```ts
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
```

1. `PrismaClient` benötigt einen Driver-Adapter. [`backend/src/lib/prisma.ts`](backend/src/lib/prisma.ts) verwendet `@prisma/adapter-pg`:

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

```bash
# Schema auf DB anwenden (kein Migrations-File — direkt pushen)
npx prisma db push

# Nach Schema-Änderung Client regenerieren
npx prisma generate

# DB interaktiv anschauen
npx prisma studio
```

> Auf Windows schlägt `prisma db push` fehl, wenn der Backend-Server läuft (DLL-Lock). Server stoppen, dann pushen: `Get-Process node | Stop-Process -Force`

### Seed

```bash
cd backend && npm run db:seed
```

Erstellt (löscht vorher alle Daten):

- `test@home.local` (EDITOR) / `viewer@home.local` (VIEWER) — Passwort je `test1234`
- 5 Räume, 5 Container-Typen, 12 Container, 15 Gegenstände, 2 Ausleihen
- 6 Tags mit Keys: `food`, `tool`, `electronics`, `clothing`, `seasonal`, `medicine`
- 17 Units mit Keys: `piece`, `pack`, `pair`, `set`, `box`, `can`, `bottle`, `roll`, `carton`, `kg`, `g`, `mg`, `liter`, `ml`, `meter`, `cm`, `tablet`

---

## Tests

**Backend** — 13 Dateien, 124 Tests (Vitest + supertest)

| Test-Datei | Was wird getestet |
|------------|-------------------|
| `jwt.test.ts` | Token signieren & verifizieren, Rollen-Roundtrip |
| `auth.middleware.test.ts` | `authenticate` + `requireEditor` Middleware |
| `errorHandler.test.ts` | ZodError → 400, generische Fehler → 500 |
| `auth.routes.test.ts` | Register, Login, Refresh-Token |
| `rooms.routes.test.ts` | CRUD Räume inkl. PUT |
| `locations.routes.test.ts` | GET, PUT (Name + Typ), DELETE, Items-Endpunkte |
| `items.routes.test.ts` | Suche, Low-Stock, CRUD, purchaseUrl-Clearing |
| `containerTypes.routes.test.ts` | CRUD Container-Typen, Farbvalidierung |
| `lendings.routes.test.ts` | Verleihen, Rückgabe, Doppelrückgabe (409), Historie |
| `tags.routes.test.ts` | Tags CRUD, Key-Validierung, 409 bei Duplikat |
| `units.routes.test.ts` | Units CRUD mit key + name, 409 bei Duplikat |
| `users.routes.test.ts` | CRUD Nutzer, Rollen-Management |
| `openapi.test.ts` | Spec-Struktur, alle Pfade und Schemas vorhanden |

**Frontend** — 3 Dateien, 12 Tests (Vitest + jsdom)

| Test-Datei | Was wird getestet |
|------------|-------------------|
| `AuthContext.test.tsx` | Login, Logout, Register, localStorage |
| `PrivateRoute.test.tsx` | Redirect ohne Session, Inhalt mit Session |
| `types.test.ts` | `CONDITION_LABELS` und `CONDITION_COLORS` |

---

## Code-Qualität

```bash
# Linting
cd backend && npm run lint
cd frontend && npm run lint

# Formatierung
cd backend && npm run format
cd frontend && npm run format
```

Backend verwendet **Zod** für alle eingehenden Requests; Fehler werden als strukturiertes JSON mit `details`-Array zurückgegeben.
