import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import type { NextResponse } from 'next/server';

import { db } from '@/src/prisma/db';

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
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined. Add it to the server environment.');
  }

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

export async function getCurrentUser(): Promise<SessionUser | null> {
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

  const user = await db.orm.public.Utilizador.where({ id: session.id }).first();

  if (!user || !user.activo || user.email !== session.email) {
    await clearSessionCookie();
    return null;
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    activo: user.activo,
  };
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
