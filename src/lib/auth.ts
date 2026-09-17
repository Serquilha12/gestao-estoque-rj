import 'server-only';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import type { NextResponse } from 'next/server';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

import { db } from '@/src/prisma/db';

const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tk_vendas';

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.JWT_SECRET ||
    'tk-rui-junior-better-auth-secret-key-prod-2026',
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  database: new Pool({
    connectionString: databaseUrl,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      perfil: {
        type: 'string',
        required: false,
        defaultValue: 'ATENDENTE',
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60 * 2, // 2 hours
  },
});

export type AuthenticatedUser = SessionUser;

export const SESSION_COOKIE = 'tk_vendas_session';
export type UserProfile = 'ADMINISTRADOR' | 'ATENDENTE';

export type SessionUser = {
  id: number;
  nome: string;
  email: string;
  perfil: UserProfile;
  activo: boolean;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'tk-rui-junior-secret-key-prod-2026-safe-token';
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    activo: user.activo,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (!payload || typeof payload.email !== 'string') {
      return null;
    }

    const perfil = payload.perfil;
    const validPerfil = perfil === 'ADMINISTRADOR' || perfil === 'ATENDENTE';

    if (!validPerfil || typeof payload.id !== 'number') {
      return null;
    }

    return {
      id: payload.id,
      nome: typeof payload.nome === 'string' ? payload.nome : '',
      email: payload.email,
      perfil,
      activo: payload.activo === true,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export async function setSessionCookieServer(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function findUserByEmail(email: string): Promise<SessionUser | null> {
  // 1. Prisma ORM
  try {
    const user = await db.orm.public.Utilizador.where({ email }).first();
    if (user && user.activo) {
      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        activo: user.activo,
      };
    }
  } catch {
    // Falha silenciosa para fallback
  }

  // 2. Supabase REST fallback
  try {
    const { supabaseAdmin } = await import('@/src/lib/supabase/admin');
    const { data } = await supabaseAdmin
      .from('Utilizador')
      .select('id, nome, email, perfil, activo')
      .eq('email', email)
      .maybeSingle();

    if (data && data.activo) {
      return {
        id: Number(data.id),
        nome: String(data.nome),
        email: String(data.email),
        perfil: data.perfil as UserProfile,
        activo: Boolean(data.activo),
      };
    }
  } catch {
    // Falha silenciosa
  }

  return null;
}

export async function findUserById(id: number): Promise<SessionUser | null> {
  // 1. Prisma ORM
  try {
    const user = await db.orm.public.Utilizador.where({ id }).first();
    if (user && user.activo) {
      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        activo: user.activo,
      };
    }
  } catch {
    // Falha silenciosa para fallback
  }

  // 2. Supabase REST fallback
  try {
    const { supabaseAdmin } = await import('@/src/lib/supabase/admin');
    const { data } = await supabaseAdmin
      .from('Utilizador')
      .select('id, nome, email, perfil, activo')
      .eq('id', id)
      .maybeSingle();

    if (data && data.activo) {
      return {
        id: Number(data.id),
        nome: String(data.nome),
        email: String(data.email),
        perfil: data.perfil as UserProfile,
        activo: Boolean(data.activo),
      };
    }
  } catch {
    // Falha silenciosa
  }

  return null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  // 1. Tenta obter sessão ativa via Better Auth
  try {
    const head = await headers();
    const session = await auth.api.getSession({
      headers: head,
    });
    if (session?.user) {
      const user = await findUserByEmail(session.user.email);
      if (user && user.activo) {
        return user;
      }
    }
  } catch {
    // Continua para verificação via cookie de sessão
  }

  // 2. Verificação via cookie de sessão
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  const user = await findUserById(session.id);

  if (!user || !user.activo || user.email !== session.email) {
    await clearSessionCookie();
    return null;
  }

  return user;
}

export async function requireAuth(fallbackPath = '/login') {
  const user = await getCurrentUser();

  if (!user) {
    redirect(fallbackPath);
  }

  return user;
}

export async function requireRole(role: UserProfile | UserProfile[], fallbackPath = '/login') {
  const user = await requireAuth(fallbackPath);
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.perfil)) {
    redirect(fallbackPath);
  }

  return user;
}
