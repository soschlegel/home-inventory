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
├── docker-compose.yml            Produktiv-Deployment (Standard, nutzt Docker Hub Images)
├── docker-compose.dev.yml        Lokale Entwicklung (baut Images lokal)
├── nginx/
│   └── nginx.conf
├── scripts/
│   ├── dev-local.js              Lokaler Schnellstart (SQLite-Setup + Backend + Frontend)
│   ├── test.sh                   Backend + Frontend Tests kombiniert
│   ├── backup.sh                 Datenbank + Uploads sichern
│   ├── restore.sh                Wiederherstellung aus Backup
│   └── release.sh                Versionierter Docker-Build + Push + Git-Tag
│
├── backend/
│   ├── Dockerfile                Multi-Stage Build
│   ├── prisma.config.ts          Prisma 7 CLI-Datasource-Config (DATABASE_URL + .env.local)
│   ├── .env.local.example        Vorlage für SQLite-Lokalbetrieb
│   ├── prisma/
│   │   ├── schema.prisma         PostgreSQL-Schema (Produktion)
│   │   ├── schema.sqlite.prisma  SQLite-Schema (lokale Entwicklung)
│   │   └── seed.ts               Demo-Daten (EDITOR + VIEWER + Units + Tags + Artikelgruppen)
│   └── src/
│       ├── index.ts              Express-App, Router-Registrierung, Swagger UI
│       ├── openapi.ts            OpenAPI 3.0.3-Spezifikation
│       ├── lib/prisma.ts         PrismaClient: PrismaPg (PostgreSQL) oder PrismaLibSql (SQLite, via .env.local)
│       ├── middleware/
│       │   ├── auth.ts           JWT-Verifikation + requireEditor
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── rooms.ts          CRUD + /tree Endpunkt (Baumstruktur)
│       │   ├── locations.ts      CRUD + Sub-Instances-Endpunkte
│       │   ├── products.ts       CRUD + Bildupload + Dokumentupload + Suche
│       │   ├── product-groups.ts Artikelgruppen-CRUD
│       │   ├── instances.ts      CRUD + Dokumentupload + Suche + Low-Stock + Expiring-Soon
│       │   ├── lendings.ts       Verleihen + Rückgabe
│       │   ├── tags.ts           Tag-CRUD (key + name)
│       │   ├── containerTypes.ts
│       │   ├── units.ts          Einheitenverwaltung (key + name)
│       │   ├── users.ts
│       │   ├── admin.ts          Export / Import
│       │   └── settings.ts       Anwendungseinstellungen (Registrierung an/aus)
│       ├── utils/
│       │   ├── jwt.ts
│       │   └── upload.ts         Multer: upload (Bilder 10 MB) + uploadDocument (PDF/Bild 20 MB)
│       └── __tests__/            16 Testdateien (169 Tests)
│
└── frontend/
    └── src/
        ├── main.tsx              i18n-Import hier (vor Render)
        ├── App.tsx
        ├── types.ts              Zentrale TypeScript-Interfaces
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
        │   ├── products.ts       Produkt-CRUD + Bild/Dokumentupload
        │   ├── instances.ts      Exemplar-CRUD + Low-Stock + Expiring-Soon
        │   ├── lendings.ts
        │   ├── containerTypes.ts
        │   ├── tags.ts
        │   ├── units.ts
        │   ├── users.ts
        │   ├── profile.ts
        │   └── settings.ts
        ├── contexts/AuthContext.tsx
        ├── components/
        │   ├── Layout.tsx            Navigation, Rollenbadge, Sprachumschalter
        │   ├── EmojiPickerInput.tsx  Emoji-Picker mit Suchfeld (Räume, Container-Typen)
        │   ├── PrivateRoute.tsx
        │   └── Spinner.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx         Low-Stock (Produkt- und Gruppensumme) + Ablaufdaten + Ausleihen
        │   ├── RoomsPage.tsx
        │   ├── RoomDetailPage.tsx
        │   ├── LocationDetailPage.tsx    Produkt-Combobox beim Hinzufügen von Exemplaren
        │   ├── ContainersPage.tsx        Baumansicht aller Räume → Container
        │   ├── ProductsPage.tsx          Alle Produkte mit Suche
        │   ├── ProductDetailPage.tsx     Stammdaten + Exemplar anlegen
        │   ├── ProductGroupsPage.tsx     Artikelgruppen-CRUD
        │   ├── InstanceDetailPage.tsx    Exemplar-Details + Verleihen + Umhängen (Container oder Person)
        │   ├── ItemsOverviewPage.tsx     Alle Exemplare, Multi-Tag-Filter
        │   ├── QRScannerPage.tsx         Kamera-Scanner für Barcodes
        │   ├── SearchPage.tsx
        │   ├── LendingsPage.tsx
        │   ├── ContainerTypesPage.tsx
        │   ├── TagsPage.tsx
        │   ├── UnitsPage.tsx
        │   ├── TranslationsPage.tsx      Zentrale Übersetzungspflege (Tab-UI)
        │   ├── UsersPage.tsx
        │   ├── AdminPage.tsx
        │   └── ProfilePage.tsx
        ├── utils/
        │   └── localizedName.ts  locRoomName / locContainerTypeName / locTagName / locUnitName
        └── __tests__/            4 Testdateien (30 Tests)
```

> **Tests gesamt:** 15 Backend-Testdateien · 4 Frontend-Testdateien

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
  └── assignedInstances → Instance[]   (Exemplare, die direkt einem Nutzer zugewiesen sind)

Unit  ← key (unique slug, z.B. "piece"), name (Anzeigename, z.B. "Stück")
        translations Json?

Tag   ← key (unique slug), name
        translations Json?
        products → ProductTag[] (m:n)

ContainerType ← key?, name, icon, color
                translations Json?

Room  ← key?, name, icon, translations Json?
 └── Location (Container, beliebig tief verschachtelbar)
      ├── containerTypeId? → ContainerType
      ├── parentId? → Location
      └── instances → Instance[]

ProductGroup (Artikelgruppe — für produktübergreifenden Mindestbestand)
  ├── name / minQuantity?
  └── products → Product[]

Product (Stammdaten — was ist dieser Gegenstand?)
  ├── name / description / imageUrl / barcode
  ├── productUrl? / unit? / minQuantity / expiryWarningDays
  ├── productGroupId? → ProductGroup
  ├── tags → ProductTag[] (m:n mit Tag)
  ├── documents → ProductDocument[]
  └── instances → Instance[]

Instance (Exemplar — ein konkretes physisches Objekt)
  ├── productId → Product
  ├── quantity / purchaseUrl? / condition / serialNumber
  ├── purchasePrice / purchaseDate / warrantyUntil / expiryDate
  ├── locationId? → Location   (oder null)
  ├── assignedUserId? → User   (oder null)
  ├── documents → InstanceDocument[]
  └── lendings → Lending[]

Lending ← instanceId → Instance, lentTo, lentAt, returnedAt?, note?
Setting ← key (PK), value (Anwendungseinstellungen, z.B. registration_enabled)
```

**`translations Json?`** speichert Übersetzungen als JSON-Objekt mit ISO-639-1-Codes als Keys: `{ "de": "Küche", "en": "Kitchen", "fr": "Cuisine" }`. Neue Sprachen erfordern keine Schema-Änderung.

### User

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `String` (cuid) | |
| `email` | `String` | eindeutig |
| `passwordHash` | `String` | bcrypt, 12 Rounds |
| `name` | `String?` | |
| `role` | `UserRole` | `EDITOR` oder `VIEWER` (Standard: `EDITOR`) |

### Room

Geteilt zwischen allen Nutzern. Löschen kaskadiert zu Locations → Instances.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `key` | `String?` | optional, eindeutiger Slug (z. B. `"kitchen"`) |
| `name` | `String` | z. B. „Küche" |
| `translations` | `Json?` | `{ "de": "Küche", "en": "Kitchen" }` |
| `description` | `String?` | |
| `icon` | `String?` | Emoji |

### Location

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | |
| `containerTypeId` | `String?` | → ContainerType (`onDelete: SetNull`) |
| `roomId` | `String` | → Room (`onDelete: Cascade`) |
| `parentId` | `String?` | → Location (Eltern) |

### ProductGroup

Artikelgruppe — fasst mehrere Produkte zu einer logischen Einheit zusammen (z. B. „Milch (alle Sorten)"). Der Mindestbestand der Gruppe wird über alle zugeordneten Produkte aufsummiert.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | |
| `minQuantity` | `Float?` | Schwellwert für Dashboard-Warnung (Summe aller Exemplare aller Gruppenprodukte) |

### Product

Stammdaten — beschreibt, was ein Gegenstand ist.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `name` | `String` | |
| `description` | `String?` | |
| `imageUrl` | `String?` | |
| `barcode` | `String?` | |
| `productUrl` | `String?` | Hersteller- oder Produktseiten-URL |
| `unit` | `String?` | Key einer Unit (z. B. `"piece"`, `"kg"`) — geerbt von Exemplaren |
| `minQuantity` | `Float?` | Schwellwert für Dashboard-Warnung (Summe aller Exemplare) |
| `expiryWarningDays` | `Int?` | Warnvorlauf in Tagen vor Ablaufdatum |
| `productGroupId` | `String?` | → ProductGroup (`onDelete: SetNull`) — optional |

`Product.unit` speichert den **Key** der Unit-Tabelle (kein FK). Anzeige: `t('unitNames.${unit}', { defaultValue: unit })`.

### Instance

Exemplar — ein konkretes physisches Objekt eines Produkts.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `productId` | `String` | → Product (`onDelete: Cascade`) |
| `quantity` | `Float` | Standard: 1 |
| `purchaseUrl` | `String?` | Exemplarspezifischer Kauflink (Shop, Händler) |
| `condition` | `ItemCondition?` | NEW / GOOD / WORN / BROKEN |
| `serialNumber` | `String?` | |
| `purchasePrice` | `Float?` | |
| `purchaseDate` | `DateTime?` | |
| `warrantyUntil` | `DateTime?` | |
| `expiryDate` | `DateTime?` | |
| `locationId` | `String?` | → Location (`onDelete: SetNull`) — optional |
| `assignedUserId` | `String?` | → User (`onDelete: SetNull`) — optional |

### Unit

Verwaltete Vorschlagsliste für `Product.unit`. Kein FK — bestehende Produkte sind von Änderungen unberührt.

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `key` | `String` | eindeutiger Slug, z. B. `"piece"`, `"kg"` |
| `name` | `String` | eindeutiger Anzeigename, z. B. `"Stück"` |
| `translations` | `Json?` | `{ "de": "Stück", "en": "piece" }` |

### Tag

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `key` | `String` | eindeutiger Slug — für Seed-Daten sprechend (`"food"`), für neue Einträge auto-UUID |
| `name` | `String` | eindeutiger Anzeigename, z. B. `"Lebensmittel"` |
| `translations` | `Json?` | `{ "de": "Lebensmittel", "en": "Food" }` |
| `products` | `ProductTag[]` | m:n zu Product (Cascade Delete) |

### ContainerType

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `key` | `String?` | optional, eindeutiger Slug (z. B. `"drawer"`) |
| `name` | `String` | eindeutig |
| `translations` | `Json?` | `{ "de": "Schublade", "en": "Drawer" }` |
| `icon` | `String?` | Emoji |
| `color` | `String?` | Hex-Farbe |

Wird ein Typ gelöscht, verlieren zugeordnete Locations ihren Typ (`onDelete: SetNull`).

### Lending

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `instanceId` | `String` | → Instance (`onDelete: Cascade`) |
| `lentTo` | `String` | Name der ausleihenden Person |
| `lentAt` | `DateTime` | Standard: now() |
| `returnedAt` | `DateTime?` | null = noch ausgeliehen |
| `note` | `String?` | |

### ProductDocument / InstanceDocument

Dateianhänge (PDFs, Bilder) — z. B. Anleitungen, Rechnungen. Gleiche Felder für beide Typen:

| Feld | Typ | |
|------|-----|-|
| `id` | `String` (cuid) | |
| `productId` / `instanceId` | `String` | → Product / Instance (`onDelete: Cascade`) |
| `originalName` | `String` | ursprünglicher Dateiname |
| `url` | `String` | Serverpfad `/uploads/<hash>.<ext>` |
| `mimeType` | `String?` | z. B. `application/pdf`, `image/jpeg` |
| `size` | `Int?` | Dateigröße in Bytes |
| `createdAt` | `DateTime` | Standard: now() |

---

## API-Dokumentation

Interaktiv: `http://localhost:4000/api/docs/`
OpenAPI JSON (für Code-Generatoren): `http://localhost:4000/api/docs.json`

Alle Endpunkte außer Auth erfordern `Authorization: Bearer <accessToken>`.
🔒 = zusätzlich Rolle **EDITOR** erforderlich.

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| `GET` | `/api/health` | — | Server-Status |
| `POST` | `/api/auth/register` | — | Account registrieren (wenn aktiviert) |
| `POST` | `/api/auth/login` | — | Login |
| `POST` | `/api/auth/refresh` | — | Access Token erneuern |
| `PUT` | `/api/auth/me` | ✓ | Eigenes Profil (Name + Passwort) ändern |
| `GET` | `/api/users` | 🔒 | Alle Nutzer |
| `POST` | `/api/users` | 🔒 | Nutzer anlegen |
| `PUT` | `/api/users/:id/role` | 🔒 | Rolle ändern |
| `PUT` | `/api/users/:id/password` | 🔒 | Passwort eines anderen Nutzers zurücksetzen |
| `DELETE` | `/api/users/:id` | 🔒 | Nutzer löschen |
| `GET` | `/api/rooms` | ✓ | Alle Räume (inkl. `translations`) |
| `GET` | `/api/rooms/tree` | ✓ | Alle Räume mit verschachtelten Containern (3 Ebenen) |
| `POST` | `/api/rooms` | 🔒 | Raum anlegen (`name`, `translations?`, `icon?`) |
| `GET` | `/api/rooms/:id` | ✓ | Raum mit Locations |
| `PUT` | `/api/rooms/:id` | 🔒 | Raum bearbeiten |
| `DELETE` | `/api/rooms/:id` | 🔒 | Raum löschen |
| `GET` | `/api/rooms/:roomId/locations` | ✓ | Locations eines Raums |
| `POST` | `/api/rooms/:roomId/locations` | 🔒 | Location anlegen |
| `GET` | `/api/locations/:id` | ✓ | Location mit Unter-Containers und Exemplaren |
| `PUT` | `/api/locations/:id` | 🔒 | Location bearbeiten |
| `DELETE` | `/api/locations/:id` | 🔒 | Location löschen |
| `GET` | `/api/locations/:id/instances` | ✓ | Exemplare einer Location |
| `POST` | `/api/locations/:id/instances` | 🔒 | Exemplar in Location anlegen (mit Produkt-Combobox) |
| `GET` | `/api/product-groups` | ✓ | Alle Artikelgruppen |
| `POST` | `/api/product-groups` | 🔒 | Artikelgruppe anlegen (`name`, `minQuantity?`) |
| `GET` | `/api/product-groups/:id` | ✓ | Artikelgruppe mit Produkten |
| `PUT` | `/api/product-groups/:id` | 🔒 | Artikelgruppe bearbeiten |
| `DELETE` | `/api/product-groups/:id` | 🔒 | Artikelgruppe löschen |
| `GET` | `/api/products` | ✓ | Alle Produkte |
| `GET` | `/api/products/search?q=` | ✓ | Produktsuche (max. 50) |
| `POST` | `/api/products` | 🔒 | Produkt anlegen |
| `GET` | `/api/products/:id` | ✓ | Produkt-Detail (inkl. Exemplare) |
| `PUT` | `/api/products/:id` | 🔒 | Produkt bearbeiten (inkl. `tags: string[]` IDs) |
| `DELETE` | `/api/products/:id` | 🔒 | Produkt löschen |
| `POST` | `/api/products/:id/image` | 🔒 | Produktbild hochladen |
| `POST` | `/api/products/:id/documents` | 🔒 | Produktdokument hochladen (PDF/Bild, max. 20 MB) |
| `DELETE` | `/api/products/:id/documents/:docId` | 🔒 | Produktdokument löschen |
| `GET` | `/api/instances` | ✓ | Alle Exemplare (Übersicht) |
| `GET` | `/api/instances/search?q=` | ✓ | Exemplarsuche (max. 50) |
| `GET` | `/api/instances/low-stock` | ✓ | Produkte und Gruppen unter Mindestbestand — gibt `LowStockItem[]` zurück (type: `'product'` oder `'group'`) |
| `GET` | `/api/instances/expiring-soon` | ✓ | Exemplare, die innerhalb des Warnfensters ablaufen |
| `POST` | `/api/instances` | 🔒 | Exemplar anlegen (locationId optional) |
| `GET` | `/api/instances/:id` | ✓ | Exemplar-Detail |
| `PUT` | `/api/instances/:id` | 🔒 | Exemplar bearbeiten |
| `DELETE` | `/api/instances/:id` | 🔒 | Exemplar löschen |
| `POST` | `/api/instances/:id/documents` | 🔒 | Exemplardokument hochladen (PDF/Bild, max. 20 MB) |
| `DELETE` | `/api/instances/:id/documents/:docId` | 🔒 | Exemplardokument löschen |
| `POST` | `/api/instances/:id/lend` | 🔒 | Exemplar verleihen |
| `GET` | `/api/instances/:id/lendings` | ✓ | Verleihistorie eines Exemplars |
| `GET` | `/api/lendings/active` | ✓ | Aktive Ausleihen |
| `GET` | `/api/lendings/:id` | ✓ | Einzelne Ausleihe |
| `PUT` | `/api/lendings/:id/return` | 🔒 | Rückgabe eintragen |
| `GET` | `/api/tags` | ✓ | Alle Tags (inkl. `_count.products`, `translations`) |
| `POST` | `/api/tags` | 🔒 | Tag anlegen — `key` wird auto-generiert |
| `PUT` | `/api/tags/:id` | 🔒 | Tag bearbeiten |
| `DELETE` | `/api/tags/:id` | 🔒 | Tag löschen (kaskadiert ProductTags) |
| `GET` | `/api/container-types` | ✓ | Alle Container-Typen (inkl. `translations`) |
| `POST` | `/api/container-types` | 🔒 | Typ anlegen (`name`, `translations?`, `icon?`, `color?`) |
| `PUT` | `/api/container-types/:id` | 🔒 | Typ bearbeiten |
| `DELETE` | `/api/container-types/:id` | 🔒 | Typ löschen |
| `GET` | `/api/units` | ✓ | Alle Einheiten (inkl. `key`, `translations`) |
| `POST` | `/api/units` | 🔒 | Einheit anlegen (`key` + `name`, `translations?`) |
| `PUT` | `/api/units/:id` | 🔒 | Einheit bearbeiten |
| `DELETE` | `/api/units/:id` | 🔒 | Einheit löschen |
| `GET` | `/api/settings` | — | Öffentliche Einstellungen (z. B. `registration_enabled`) |
| `PUT` | `/api/settings` | 🔒 | Einstellung setzen |
| `GET` | `/api/admin/export` | 🔒 | Vollständiger Daten-Export (JSON) |
| `POST` | `/api/admin/import` | 🔒 | Daten-Import (überschreibt alles außer Usern) |

### Translations-Körper

```json
{ "name": "Küche", "translations": { "de": "Küche", "en": "Kitchen", "fr": "Cuisine" } }
```

Beim Update werden die `translations` vollständig ersetzt — das Frontend merged fehlende Sprachen selbst (Patch-Logik in `TranslationsPage`).

### Unit-Körper

```json
{ "key": "piece", "name": "Stück", "translations": { "de": "Stück", "en": "piece" } }
```

`key` muss dem Muster `/^[a-z][a-z0-9_]*$/` entsprechen (Zod-Validierung, max. 50 Zeichen). Doppelte Keys oder Namen werden mit `409 Conflict` abgelehnt.

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

**Namespaces:** `common`, `nav`, `login`, `dashboard`, `rooms`, `containers`, `roomDetail`, `location`, `products`, `instance`, `condition`, `search`, `lendings`, `containerTypes`, `units`, `tags`, `users`, `itemsOverview`, `translations`, `emojiPicker`, `qrscanner`, `admin`, `profile`, `tagNames`, `unitNames`, `containerTypeNames`, `roomNames`

**Sprachumschalter:** Button in der Sidebar-Footer-Leiste. Speichert Auswahl in `localStorage('lang')`.

**Pluralformen:** i18next-Konvention `key_one` / `key_other` mit `t('key', { count })` — z. B. für Container- und Item-Zähler.

### Übersetzungsstrategie (zweistufig)

Übersetzungen für Räume, Tags, ContainerTypes und Units werden **primär in der Datenbank** als `translations Json?` gespeichert. Die i18n-JSON-Dateien (`tagNames`, `roomNames` usw.) dienen als Fallback für Seed-Daten mit sprechendem `key`.

Die Helper-Funktionen in `frontend/src/utils/localizedName.ts` kapseln die Priorität:

```ts
// Priorität: 1. DB-Übersetzung  2. i18n JSON-Fallback  3. name-Feld
locRoomName(t, room)           // room.translations[lang] || t('roomNames.key') || name
locContainerTypeName(t, ct)    // ct.translations[lang]   || t('containerTypeNames.key') || name
locTagName(t, tag)             // tag.translations[lang]  || t('tagNames.key') || name
locUnitName(t, unit)           // unit.translations[lang] || t('unitNames.key') || name
```

Benutzerdefinierte Einträge ohne `key` zeigen automatisch den DB-`name` als Fallback.

Die **TranslationsPage** (`/translations`) erlaubt das zentrale Bearbeiten von DE/EN-Übersetzungen für alle vier Typen. Andere bereits gespeicherte Sprachen (z. B. `fr`) bleiben beim Speichern erhalten (Merge-Logik im Frontend).

---

## Datei-Upload

Zwei separate Multer-Instanzen in `backend/src/utils/upload.ts`:

### Bildupload

Upload via `POST /api/products/:id/image` (`multipart/form-data`, Feld `image`).

- Max. Dateigröße: **10 MB**
- Erlaubte MIME-Types: `image/*`
- Dateiname: 16 zufällige Hex-Bytes + Original-Erweiterung
- Speicherort: `UPLOAD_DIR` (Standard `./uploads`, Docker `/app/uploads`)
- Nginx serviert `/uploads/*` direkt mit `Cache-Control: public, immutable, max-age=30d`

Altes Bild wird beim Überschreiben oder Produkt-Löschen automatisch entfernt.

### Dokumentupload

Dokumente können sowohl an **Produkte** als auch an **Exemplare** gehängt werden:

- `POST /api/products/:id/documents` (`multipart/form-data`, Feld `document`) → `ProductDocument`
- `POST /api/instances/:id/documents` (`multipart/form-data`, Feld `document`) → `InstanceDocument`

Eigenschaften für beide:

- Max. Dateigröße: **20 MB**
- Erlaubte MIME-Types: `image/*` und `application/pdf`
- Dateiname: 16 zufällige Hex-Bytes + Original-Erweiterung
- Speicherort: gleicher `UPLOAD_DIR`
- Metadaten (originalName, mimeType, size, url) werden in der jeweiligen Dokument-Tabelle gespeichert
- Beim Löschen (`DELETE /api/products/:id/documents/:docId` / `DELETE /api/instances/:id/documents/:docId`) wird die Datei von der Festplatte entfernt

---

## Prisma & Schema

Prisma 7 hat gegenüber Prisma 5 Breaking Changes:

1. `datasource.url` steht nicht mehr in `schema.prisma`, sondern in [`backend/prisma.config.ts`](backend/prisma.config.ts). Die Datei lädt zusätzlich `.env.local` (falls vorhanden) als Override:

```ts
import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { existsSync } from 'fs';

config({ path: '.env' });
if (existsSync('.env.local')) config({ path: '.env.local', override: true });

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
```

1. `PrismaClient` benötigt einen Driver-Adapter. [`backend/src/lib/prisma.ts`](backend/src/lib/prisma.ts) erkennt automatisch, ob PostgreSQL oder SQLite verwendet wird:

```ts
// DATABASE_URL=file:./dev.db  → LibSQL-Adapter (SQLite, lokale Entwicklung)
// DATABASE_URL=postgresql://… → PrismaPg-Adapter (PostgreSQL, Produktion)
function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('file:')) {
    return new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  }
  const pool = new pg.Pool({ connectionString: url });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
```

**Duales Schema:** `schema.prisma` (PostgreSQL, Produktion) und `schema.sqlite.prisma` (SQLite, lokale Entwicklung) haben identischen Inhalt — nur der `provider` unterscheidet sich.

```bash
# PostgreSQL (Standard)
npx prisma db push
npx prisma generate

# SQLite (lokal, ohne Docker)
npm run db:setup:sqlite   # generate + db push mit schema.sqlite.prisma
npx tsx prisma/seed.ts    # Testdaten einspielen

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

**Backend** — 16 Dateien · 169 Tests (Vitest + supertest)

| Test-Datei | Was wird getestet |
|------------|-------------------|
| `jwt.test.ts` | Token signieren & verifizieren, Rollen-Roundtrip |
| `auth.middleware.test.ts` | `authenticate` + `requireEditor` Middleware |
| `errorHandler.test.ts` | ZodError → 400, generische Fehler → 500 |
| `auth.routes.test.ts` | Register, Login, Refresh-Token |
| `rooms.routes.test.ts` | CRUD Räume, `/tree`-Endpunkt, `translations`-Objekt, 404 |
| `locations.routes.test.ts` | GET, PUT (Name + Typ), DELETE, Instances-Endpunkte |
| `products.routes.test.ts` | CRUD Produkte, Suche, Bildupload, Dokumentupload, productUrl-Clearing |
| `product-groups.routes.test.ts` | CRUD Artikelgruppen, Produkt-Zuweisung, Low-Stock-Aggregation |
| `instances.routes.test.ts` | CRUD Exemplare, Low-Stock (Produkt- und Gruppenebene), Expiring-Soon, POST ohne Standort |
| `containerTypes.routes.test.ts` | CRUD, `translations` inkl. Drittsprache, Farbvalidierung |
| `lendings.routes.test.ts` | Verleihen, Rückgabe, Doppelrückgabe (409), Historie |
| `tags.routes.test.ts` | Tags CRUD, `translations`, 409 bei Duplikat |
| `units.routes.test.ts` | Units CRUD mit key + name + `translations`, 409 |
| `users.routes.test.ts` | CRUD Nutzer, Rollen-Management |
| `admin.routes.test.ts` | Export/Import inkl. Artikelgruppen |
| `openapi.test.ts` | Spec-Struktur, alle Pfade und Schemas vorhanden |

**Frontend** — 4 Dateien · ~30 Tests (Vitest + jsdom)

| Test-Datei | Was wird getestet |
|------------|-------------------|
| `AuthContext.test.tsx` | Login, Logout, Register, localStorage |
| `PrivateRoute.test.tsx` | Redirect ohne Session, Inhalt mit Session |
| `localizedName.test.ts` | `locRoomName`, `locContainerTypeName`, `locTagName`, `locUnitName` — translations/Fallback/Drittsprachen |
| `types.test.ts` | `CONDITION_LABELS` und `CONDITION_COLORS` — alle Zustände, deutsche Labels, Tailwind-Klassen |

---

## CI/CD (GitHub Actions)

Datei: `.github/workflows/release.yml`

```text
push → main
 └── Job: test
      ├── npm ci && npm test (Backend)
      └── npm ci && npm test (Frontend)
          ↓ (nur bei Erfolg)
 └── Job: build-and-push
      ├── Docker Build backend  → soschlegel/home-inventory-backend:latest + :<sha>
      ├── Docker Build frontend → soschlegel/home-inventory-frontend:latest + :<sha>
      ├── Docker Build nginx    → soschlegel/home-inventory-nginx:latest + :<sha>
      └── Portainer Webhook     (optional, Secret PORTAINER_WEBHOOK_URL)
```

GitHub Secrets benötigt: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. Optional: `PORTAINER_WEBHOOK_URL`.

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
