import { config } from 'dotenv';
import { existsSync } from 'fs';

// .env.local überschreibt .env (analog zu Next.js-Konvention)
config({ path: '.env' });
if (existsSync('.env.local')) config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaLibSql } from '@prisma/adapter-libsql';

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? '';

  if (url.startsWith('file:')) {
    // SQLite via LibSQL (lokales Testen ohne PostgreSQL/Docker)
    const adapter = new PrismaLibSql({ url });
    return new PrismaClient({ adapter });
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
