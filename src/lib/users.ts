import 'server-only';

import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
import { hashPassword } from '@/src/lib/password';
import { userCreateSchema, userUpdateSchema } from '@/src/lib/validators';

export async function getUsers() {
  try {
    return await db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil', 'activo', 'criadoEm').orderBy((u) => u.nome.asc()).all();
  } catch {
    try {
      const { data } = await supabaseAdmin.from('Utilizador').select('id, nome, email, perfil, activo, criadoEm').order('nome', { ascending: true });
      return (data ?? []).map((u) => ({
        id: Number(u.id),
        nome: String(u.nome),
        email: String(u.email),
        perfil: u.perfil as 'ADMINISTRADOR' | 'ATENDENTE',
        activo: Boolean(u.activo),
        criadoEm: String(u.criadoEm),
      }));
    } catch {
      return [];
    }
  }
}

export async function createUser(input: { nome: string; email: string; password: string; perfil: 'ADMINISTRADOR' | 'ATENDENTE'; activo?: boolean }) {
  const parsed = userCreateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  try {
    const emailExists = await db.orm.public.Utilizador.where({ email: normalizedEmail }).first();

    if (emailExists) {
      throw new Error('Este email já está em uso.');
    }

    const existingAdmins = await db.orm.public.Utilizador
      .where({ perfil: 'ADMINISTRADOR', activo: true })
      .all();

    if (parsed.data.perfil === 'ATENDENTE' && existingAdmins.length === 0) {
      throw new Error('É necessário existir pelo menos um administrador activo.');
    }

    const passwordHash = await hashPassword(parsed.data.password);

    return await db.orm.public.Utilizador.create({
      nome: parsed.data.nome.trim(),
      email: normalizedEmail,
      palavraPasse: passwordHash,
      perfil: parsed.data.perfil,
      activo: parsed.data.activo ?? true,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('em uso') || err.message.includes('pelo menos um'))) {
      throw err;
    }

    // Fallback Supabase REST
    const { data: existing } = await supabaseAdmin.from('Utilizador').select('id').ilike('email', normalizedEmail).maybeSingle();
    if (existing) {
      throw new Error('Este email já está em uso.');
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const { data, error } = await supabaseAdmin
      .from('Utilizador')
      .insert({
        nome: parsed.data.nome.trim(),
        email: normalizedEmail,
        palavraPasse: passwordHash,
        perfil: parsed.data.perfil,
        activo: parsed.data.activo ?? true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao criar utilizador.');
    }

    return {
      id: Number(data.id),
      nome: String(data.nome),
      email: String(data.email),
      perfil: data.perfil,
      activo: Boolean(data.activo),
      criadoEm: String(data.criadoEm),
    };
  }
}

export async function updateUser(input: { id: number; nome: string; email: string; perfil: 'ADMINISTRADOR' | 'ATENDENTE'; activo: boolean }) {
  const parsed = userUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  try {
    const existingUser = await db.orm.public.Utilizador.where({ id: parsed.data.id }).first();

    if (!existingUser) {
      throw new Error('Utilizador não encontrado.');
    }

    const emailInUse = await db.orm.public.Utilizador
      .where((u) => u.email.eq(normalizedEmail))
      .where((u) => u.id.neq(parsed.data.id))
      .first();

    if (emailInUse) {
      throw new Error('Este email já está em uso por outro utilizador.');
    }

    return await db.orm.public.Utilizador.where({ id: parsed.data.id }).update({
      nome: parsed.data.nome.trim(),
      email: normalizedEmail,
      perfil: parsed.data.perfil,
      activo: parsed.data.activo,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('em uso') || err.message.includes('não encontrado'))) {
      throw err;
    }

    // Fallback Supabase REST
    const { data: existingUser } = await supabaseAdmin.from('Utilizador').select('*').eq('id', parsed.data.id).maybeSingle();
    if (!existingUser) {
      throw new Error('Utilizador não encontrado.');
    }

    const { data: emailUsers } = await supabaseAdmin.from('Utilizador').select('id').ilike('email', normalizedEmail);
    if (emailUsers && emailUsers.some((u) => Number(u.id) !== parsed.data.id)) {
      throw new Error('Este email já está em uso por outro utilizador.');
    }

    const { data, error } = await supabaseAdmin
      .from('Utilizador')
      .update({
        nome: parsed.data.nome.trim(),
        email: normalizedEmail,
        perfil: parsed.data.perfil,
        activo: parsed.data.activo,
      })
      .eq('id', parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao actualizar utilizador.');
    }

    return {
      id: Number(data.id),
      nome: String(data.nome),
      email: String(data.email),
      perfil: data.perfil,
      activo: Boolean(data.activo),
    };
  }
}

export async function changeUserPassword(id: number, currentPassword: string, newPassword: string) {
  let user: any = null;
  try {
    user = await db.orm.public.Utilizador.where({ id }).first();
  } catch {
    const { data } = await supabaseAdmin.from('Utilizador').select('*').eq('id', id).maybeSingle();
    user = data;
  }

  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }

  const validCurrentPassword = await import('@/src/lib/password').then(({ verifyPassword }) => verifyPassword(currentPassword, user.palavraPasse));

  if (!validCurrentPassword) {
    throw new Error('A palavra-passe actual está incorreta.');
  }

  const passwordHash = await hashPassword(newPassword);

  try {
    await db.orm.public.Utilizador.where({ id }).update({
      palavraPasse: passwordHash,
    });
  } catch {
    await supabaseAdmin.from('Utilizador').update({ palavraPasse: passwordHash }).eq('id', id);
  }
}

export async function setUserActiveStatus(id: number, activo: boolean) {
  try {
    const user = await db.orm.public.Utilizador.where({ id }).first();
    if (!user) {
      throw new Error('Utilizador não encontrado.');
    }
    return await db.orm.public.Utilizador.where({ id }).update({ activo });
  } catch (err) {
    if (err instanceof Error && err.message.includes('não encontrado')) {
      throw err;
    }
    const { data, error } = await supabaseAdmin
      .from('Utilizador')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Utilizador não encontrado.');
    }
    return data;
  }
}
