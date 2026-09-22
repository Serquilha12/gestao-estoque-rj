'use server';

import { redirect } from 'next/navigation';

import { createSessionToken, requireAuth, setSessionCookieServer } from '@/src/lib/auth';
import { db } from '@/src/prisma/db';
import { verifyPassword } from '@/src/lib/password';
import { loginSchema } from '@/src/lib/validators';

export async function loginAction(
  previousState: { message: string },
  formData: FormData,
): Promise<{ message: string }> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? 'Credenciais inválidas.' };
  }

  const user = await db.orm.public.Utilizador.where({ email: parsed.data.email }).first();

  if (!user || !user.activo || !(await verifyPassword(parsed.data.password, user.palavraPasse))) {
    return { message: 'Credenciais inválidas.' };
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
}

export async function logoutAction() {
  const user = await requireAuth('/login');

  if (user) {
    const cookieStore = await import('next/headers').then(({ cookies }) => cookies());
    cookieStore.delete('tk_vendas_session');
  }

  redirect('/login');
}
