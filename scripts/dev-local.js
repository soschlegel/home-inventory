'use strict';
const { execSync, spawn } = require('child_process');
const { existsSync, writeFileSync } = require('fs');
const { join } = require('path');
const readline = require('readline');

const ROOT = join(__dirname, '..');
const BACKEND = join(ROOT, 'backend');
const FRONTEND = join(ROOT, 'frontend');
const ENV_LOCAL = join(BACKEND, '.env.local');
const DEV_DB = join(BACKEND, 'dev.db');

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function killProcess(proc) {
  if (!proc.pid) return;
  if (process.platform === 'win32') {
    try { execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' }); } catch (_) {}
  } else {
    try { process.kill(-proc.pid, 'SIGTERM'); } catch (_) { try { proc.kill(); } catch (_) {} }
  }
}

console.log('\n🏠  Home Inventory — lokale Testumgebung\n');

// Schritt 1: .env.local anlegen (einmalig)
if (!existsSync(ENV_LOCAL)) {
  writeFileSync(ENV_LOCAL, 'DATABASE_URL=file:./dev.db\n');
  console.log('✅  backend/.env.local angelegt (SQLite)\n');
}

// Schritt 2: SQLite-Schema + Seed (nur beim ersten Start)
if (!existsSync(DEV_DB)) {
  console.log('📦  SQLite-Schema einrichten (erstmalig)...');
  run('npm run db:setup:sqlite', BACKEND);
  console.log('\n🌱  Testdaten einspielen...');
  run('npx tsx prisma/seed.ts', BACKEND);
  console.log('');
}

// Schritt 3: Backend + Frontend parallel starten
console.log('🚀  Starte Entwicklungsserver...');
console.log('    Backend  → http://localhost:4000');
console.log('    Frontend → http://localhost:5173\n');
console.log('    EDITOR:  test@home.local / test1234');
console.log('    VIEWER:  viewer@home.local / test1234\n');
console.log('    Zum Beenden: Strg + C\n');

const spawnOpts = { stdio: 'inherit', shell: true };
const backend = spawn('npm', ['run', 'dev'], { ...spawnOpts, cwd: BACKEND });
const frontend = spawn('npm', ['run', 'dev'], { ...spawnOpts, cwd: FRONTEND });

// Windows: readline nötig damit Ctrl+C als SIGINT weitergeleitet wird
if (process.platform === 'win32') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('SIGINT', () => process.emit('SIGINT'));
}

process.on('SIGINT', () => {
  console.log('\n\n🛑  Server werden gestoppt...');
  killProcess(backend);
  killProcess(frontend);
  process.exit(0);
});

backend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n⚠️  Backend unerwartet beendet (Code ${code})`);
  }
});

frontend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n⚠️  Frontend unerwartet beendet (Code ${code})`);
  }
});
