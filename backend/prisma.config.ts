import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { existsSync } from 'fs';

config({ path: '.env' });
if (existsSync('.env.local')) config({ path: '.env.local', override: true });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
