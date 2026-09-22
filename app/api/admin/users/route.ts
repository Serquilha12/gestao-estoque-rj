import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { userCreateSchema, userUpdateSchema } from '@/src/lib/validators';
import { db } from '@/src/prisma/db';
import { hashPassword } from '@/src/lib/password';

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const users = await db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil', 'activo', 'criadoEm').orderBy((u) => u.nome.asc()).all();

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  }

  const existingUser = await db.orm.public.Utilizador.where({ email: parsed.data.email }).first();

  if (existingUser) {
    return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const createdUser = await db.orm.public.Utilizador.create({
    nome: parsed.data.nome,
    email: parsed.data.email,
    palavraPasse: passwordHash,
    perfil: parsed.data.perfil,
    activo: parsed.data.activo,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: createdUser.id,
      nome: createdUser.nome,
      email: createdUser.email,
      perfil: createdUser.perfil,
      activo: createdUser.activo,
    },
  }, { status: 201 });
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  }

  const existingUser = await db.orm.public.Utilizador.where({ id: parsed.data.id }).first();

  if (!existingUser) {
    return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
  }

  const emailInUse = await db.orm.public.Utilizador
    .where((u) => u.email.eq(parsed.data.email))
    .where((u) => u.id.neq(parsed.data.id))
    .first();

  if (emailInUse) {
    return NextResponse.json({ error: 'Este email já está em uso por outro utilizador.' }, { status: 409 });
  }

  if (existingUser.perfil === 'ADMINISTRADOR' && existingUser.activo && parsed.data.perfil === 'ATENDENTE') {
    const remainingAdmins = await db.orm.public.Utilizador.where({ perfil: 'ADMINISTRADOR', activo: true }).all();

    if (remainingAdmins.length <= 1) {
      return NextResponse.json({ error: 'Não pode remover o último administrador activo.' }, { status: 400 });
    }
  }

  if (existingUser.perfil === 'ADMINISTRADOR' && existingUser.activo && !parsed.data.activo) {
    const remainingAdmins = await db.orm.public.Utilizador.where({ perfil: 'ADMINISTRADOR', activo: true }).all();

    if (remainingAdmins.length <= 1) {
      return NextResponse.json({ error: 'Não pode desactivar o último administrador activo.' }, { status: 400 });
    }
  }

  const updatedUser = await db.orm.public.Utilizador.where({ id: parsed.data.id }).update({
    nome: parsed.data.nome,
    email: parsed.data.email,
    perfil: parsed.data.perfil,
    activo: parsed.data.activo,
  });

  return NextResponse.json({ ok: true, user: updatedUser });
}
