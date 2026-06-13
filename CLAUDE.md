# Home Inventory — Claude-Anweisungen

## Vor jedem Commit

1. **Version hochzählen** — Patch-Version (`x.y.Z`) in beiden Dateien synchron erhöhen:
   - `backend/package.json`
   - `frontend/package.json`

2. **Build prüfen:**
   ```
   cd backend && npm run build
   cd frontend && npm run build
   ```

3. **Tests ausführen und Fehler beheben:**
   ```
   cd backend && npm test
   cd frontend && npm test
   ```
   Schlägt ein Test fehl → zuerst beheben, dann committen.

4. **Prisma-Client regenerieren** wenn `backend/prisma/schema.prisma` geändert wurde:
   ```
   cd backend && npx prisma generate
   ```

## Dokumentation aktualisieren

Wenn neue Features hinzukommen oder sich die Projektstruktur, das Datenmodell oder die API ändert:
- `README.md` — Features-Liste und Test-Zähler
- `TECHNICAL.md` — Projektstruktur, Datenmodell, API-Tabelle, Tests-Tabelle
