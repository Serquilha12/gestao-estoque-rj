'use server';

import { redirect } from 'next/navigation';

import { createSessionToken, requireAuth, setSessionCookieServer, SESSION_COOKIE } from '@/src/lib/auth';
import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
import { verifyPassword } from '@/src/lib/password';
import { loginSchema } from '@/src/lib/validators';

async function findUserByEmail(email: string) {
  // 1. Tenta consulta via Supabase REST (instantâneo via HTTPS)
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
    // Falha silenciosa para fallback
  }

  // 2. Consulta direta via Prisma ORM
  try {
    const user = await db.orm.public.Utilizador.where({ email }).first();
    if (user) return user;
  } catch {
    // Falha silenciosa
  }

  return null;
}

export async function loginAction(
  previousState: { message: string },
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      return { message: parsed.error.issues[0]?.message ?? 'Credenciais inválidas.' };
    }

    const user = await findUserByEmail(parsed.data.email);

    if (!user || !user.activo || !(await verifyPassword(parsed.data.password, user.palavraPasse))) {
      return { message: 'Credenciais inválidas. Verifique o email e a palavra-passe.' };
    }

    const sessionToken = await createSessionToken({
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      activo: user.activo,
    });

    await setSessionCookieServer(sessionToken);

    redirect(user.perfil === 'ADMINISTRADOR' ? '/app/admin' : '/app/atendente');
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof (err as { digest: unknown }).digest === 'string' &&
      (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }

    console.error('Erro no login:', err);
    return {
      message: 'Ocorreu um erro ao processar o login. Por favor, tente novamente.',
    };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await import('next/headers').then(({ cookies }) => cookies());
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  } catch (err) {
    console.error('Erro ao terminar sessão:', err);
  }

  redirect('/login');
}
