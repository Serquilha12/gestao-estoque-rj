import 'dotenv/config';
import 'server-only';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined. Add it to the server environment before using the database.');
}

export const db = postgres<Contract>({
  contractJson,
  url: databaseUrl,
});
