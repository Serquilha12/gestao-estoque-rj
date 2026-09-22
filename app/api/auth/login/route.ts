import { NextResponse } from 'next/server';

import { createSessionToken, SESSION_COOKIE } from '@/src/lib/auth';
import { verifyPassword } from '@/src/lib/password';
import { loginSchema } from '@/src/lib/validators';
import { db } from '@/src/prisma/db';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Credenciais inválidas.' }, { status: 400 });
  }

  const user = await db.orm.public.Utilizador.where({ email: parsed.data.email }).first();

  if (!user || !user.activo || !(await verifyPassword(parsed.data.password, user.palavraPasse))) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  const token = await createSessionToken({
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    activo: user.activo,
  });

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      activo: user.activo,
    },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
