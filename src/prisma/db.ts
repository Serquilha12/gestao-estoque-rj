import 'dotenv/config';
import 'server-only';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const databaseUrl =
  process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/tk_vendas';

export const db = postgres<Contract>({
  contractJson,
  url: databaseUrl,
});
