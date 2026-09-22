import 'server-only';

import { db } from '@/src/prisma/db';
import { hashPassword } from '@/src/lib/password';
import { userCreateSchema, userUpdateSchema } from '@/src/lib/validators';

export async function getUsers() {
  return db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil', 'activo', 'criadoEm').orderBy((u) => u.nome.asc()).all();
}

export async function createUser(input: { nome: string; email: string; password: string; perfil: 'ADMINISTRADOR' | 'ATENDENTE'; activo?: boolean }) {
  const parsed = userCreateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const emailExists = await db.orm.public.Utilizador.where({ email: parsed.data.email }).first();

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

  return db.orm.public.Utilizador.create({
    nome: parsed.data.nome,
    email: parsed.data.email,
    palavraPasse: passwordHash,
    perfil: parsed.data.perfil,
    activo: parsed.data.activo ?? true,
  });
}

export async function updateUser(input: { id: number; nome: string; email: string; perfil: 'ADMINISTRADOR' | 'ATENDENTE'; activo: boolean }) {
  const parsed = userUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const existingUser = await db.orm.public.Utilizador.where({ id: parsed.data.id }).first();

  if (!existingUser) {
    throw new Error('Utilizador não encontrado.');
  }

  const emailInUse = await db.orm.public.Utilizador
    .where((u) => u.email.eq(parsed.data.email))
    .where((u) => u.id.neq(parsed.data.id))
    .first();

  if (emailInUse) {
    throw new Error('Este email já está em uso por outro utilizador.');
  }

  const activeAdmins = await db.orm.public.Utilizador
    .where({ perfil: 'ADMINISTRADOR', activo: true })
    .all();

  if (
    existingUser.perfil === 'ADMINISTRADOR' &&
    existingUser.activo &&
    parsed.data.perfil === 'ATENDENTE'
  ) {
    if (activeAdmins.length <= 1) {
      throw new Error('Não pode remover o último administrador activo.');
    }
  }

  if (existingUser.perfil === 'ADMINISTRADOR' && existingUser.activo && !parsed.data.activo) {
    if (activeAdmins.length <= 1) {
      throw new Error('Não pode desactivar o último administrador activo.');
    }
  }

  return db.orm.public.Utilizador.where({ id: parsed.data.id }).update({
    nome: parsed.data.nome,
    email: parsed.data.email,
    perfil: parsed.data.perfil,
    activo: parsed.data.activo,
  });
}

export async function changeUserPassword(id: number, currentPassword: string, newPassword: string) {
  const user = await db.orm.public.Utilizador.where({ id }).first();

  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }

  const validCurrentPassword = await import('@/src/lib/password').then(({ verifyPassword }) => verifyPassword(currentPassword, user.palavraPasse));

  if (!validCurrentPassword) {
    throw new Error('A palavra-passe actual está incorreta.');
  }

  const passwordHash = await hashPassword(newPassword);

  await db.orm.public.Utilizador.where({ id }).update({
    palavraPasse: passwordHash,
  });
}

export async function setUserActiveStatus(id: number, activo: boolean) {
  const user = await db.orm.public.Utilizador.where({ id }).first();

  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }

  if (user.perfil === 'ADMINISTRADOR' && user.activo && !activo) {
    const activeAdmins = await db.orm.public.Utilizador
      .where({ perfil: 'ADMINISTRADOR', activo: true })
      .all();

    if (activeAdmins.length <= 1) {
      throw new Error('Não pode desactivar o último administrador activo.');
    }
  }

  return db.orm.public.Utilizador.where({ id }).update({ activo });
}
