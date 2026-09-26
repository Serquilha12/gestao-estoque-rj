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

/**
 * Circuit Breaker para eliminar atrasos (delays) na aplicação:
 * No Vercel / Serverless, a base de dados PostgreSQL do Supabase não possui
 * os marcadores de contrato do Prisma 8 runtime (causando "Database error while reading contract marker").
 * Tentativas repetidas adicionam 1 a 3 segundos de timeout/espera em cada requisição.
 * Se o Prisma falhar ou se estiver no Vercel com Supabase REST, direcionamos
 * imediatamente para o Supabase REST, reduzindo a latência de 2000ms para ~40ms (0ms delay).
 */
const isVercel = Boolean(process.env.VERCEL);
let prismaUsable: boolean = !isVercel && process.env.FORCE_SUPABASE_REST !== 'true';

export function canUsePrisma(): boolean {
  if (process.env.FORCE_PRISMA === 'true') return true;
  if (process.env.FORCE_SUPABASE_REST === 'true') return false;
  return prismaUsable;
}

export function reportPrismaSuccess() {
  prismaUsable = true;
}

export function reportPrismaFailure(error?: unknown) {
  if (prismaUsable) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[DB Circuit Breaker] Prisma indisponível (${msg}). Direcionando para Supabase REST (0ms delay).`);
    prismaUsable = false;
  }
}
