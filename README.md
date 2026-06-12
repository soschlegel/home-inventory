# Home Inventory

Webanwendung zur Verwaltung von Haushaltsgegenständen — was liegt wo, in welcher Menge, mit Fotos.

## Features (geplant)

- Gegenstände erfassen mit Name, Beschreibung, Menge und Foto
- Organisieren nach Raum → Möbelstück/Behälter → Regal/Fach
- Suche und Filterung über alle Gegenstände
- Benutzerverwaltung mit JWT-Authentifizierung
- Bildupload für Gegenstände und Orte

## Tech Stack

| Schicht     | Technologie                     |
|-------------|---------------------------------|
| Backend     | Node.js + TypeScript + Express  |
| ORM         | Prisma                          |
| Datenbank   | PostgreSQL 16                   |
| Frontend    | React + TypeScript              |
| Infra       | Docker Compose + Nginx          |

## Architektur

```
Browser
  └── Nginx :3000
        ├── /api/*      → Backend  :4000  (Express API)
        ├── /uploads/*  → Volume          (Statische Dateien)
        └── /*          → Frontend :80    (React)
```

## Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/) (ab v3.9)

## Quickstart

```bash
# 1. Umgebungsvariablen anlegen
cp .env.example .env
# .env editieren und sichere Passwörter/Secrets setzen

# 2. Container starten
docker compose up -d

# 3. App aufrufen
open http://localhost:3000
```

## Entwicklung

### Backend lokal starten

```bash
cd backend
npm install
npm run dev
```

### Frontend lokal starten

```bash
cd frontend
npm install
npm run dev
```

### Datenbank-Migrationen

```bash
cd backend
npx prisma migrate dev   # neue Migration erstellen
npx prisma studio        # Datenbank im Browser anschauen
```

## Umgebungsvariablen

Alle Variablen sind in `.env.example` dokumentiert. Für den Start muss `.env` existieren:

| Variable              | Beschreibung                        |
|-----------------------|-------------------------------------|
| `DB_PASSWORD`         | PostgreSQL-Passwort                 |
| `JWT_SECRET`          | Secret für Access-Tokens            |
| `JWT_REFRESH_SECRET`  | Secret für Refresh-Tokens           |
| `PORT`                | Öffentlicher Port (Standard: 3000)  |

## Projektstruktur

```
home-inventory/
├── backend/
│   ├── prisma/          # Datenbankschema & Migrationen
│   └── src/
│       ├── middleware/  # Auth, Validierung, Error-Handling
│       ├── routes/      # API-Endpunkte
│       └── utils/       # Hilfsfunktionen
├── frontend/
│   └── src/
│       ├── api/         # API-Client
│       ├── components/  # Wiederverwendbare UI-Komponenten
│       ├── contexts/    # React Context (Auth, Inventory)
│       └── pages/       # Seitenkomponenten
├── nginx/
│   └── nginx.conf       # Reverse-Proxy-Konfiguration
├── docker-compose.yml
└── .env.example
```

## Status

> **Skeleton** — Infrastruktur fertig, Anwendungslogik noch nicht implementiert.
