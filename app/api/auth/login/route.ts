import { NextResponse } from 'next/server';

import { createSessionToken, SESSION_COOKIE } from '@/src/lib/auth';
import { verifyPassword } from '@/src/lib/password';
import { loginSchema } from '@/src/lib/validators';
import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';

async function findUser(email: string) {
  try {
    const user = await db.orm.public.Utilizador.where({ email }).first();
    if (user) return user;
  } catch {
    // Falha silenciosa
  }

  try {
    const { data } = await supabaseAdmin
      .from('Utilizador')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (data) {
      return {
        id: Number(data.id),
        nome: String(data.nome),
        email: String(data.email),
        palavraPasse: String(data.palavraPasse),
        perfil: data.perfil as 'ADMINISTRADOR' | 'ATENDENTE',
        activo: Boolean(data.activo),
      };
    }
  } catch {
    // Falha silenciosa
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Credenciais inválidas.' },
        { status: 400 }
      );
    }

    const user = await findUser(parsed.data.email);

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
  } catch (err) {
    console.error('Erro na API de login:', err);
    return NextResponse.json(
      { error: 'Erro no servidor ao processar autenticação.' },
      { status: 500 }
    );
  }
}
