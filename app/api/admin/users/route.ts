import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { userCreateSchema, userUpdateSchema } from '@/src/lib/validators';
import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
import { hashPassword } from '@/src/lib/password';

// Limites de utilizadores
const MAX_TOTAL_USERS = 3;
const MAX_ADMINS = 1;
const MAX_ATENDENTES = 2;

async function getAllUsers() {
  try {
    return await db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil', 'activo', 'criadoEm').orderBy((u) => u.nome.asc()).all();
  } catch {
    const { data } = await supabaseAdmin.from('Utilizador').select('id, nome, email, perfil, activo, criadoEm').order('nome', { ascending: true });
    return (data ?? []).map((u) => ({
      id: Number(u.id),
      nome: String(u.nome),
      email: String(u.email),
      perfil: u.perfil as 'ADMINISTRADOR' | 'ATENDENTE',
      activo: Boolean(u.activo),
      criadoEm: String(u.criadoEm),
    }));
  }
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const users = await getAllUsers();

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

  // Verificar limites de utilizadores
  const allUsers = await getAllUsers();
  const activeUsers = allUsers.filter((u) => u.activo);

  if (activeUsers.length >= MAX_TOTAL_USERS) {
    return NextResponse.json({
      error: `O sistema está limitado a ${MAX_TOTAL_USERS} utilizadores activos (${MAX_ADMINS} administrador + ${MAX_ATENDENTES} atendentes). Desactive um utilizador existente antes de criar um novo.`,
    }, { status: 400 });
  }

  const activeAdmins = activeUsers.filter((u) => u.perfil === 'ADMINISTRADOR').length;
  const activeAtendentes = activeUsers.filter((u) => u.perfil === 'ATENDENTE').length;

  if (parsed.data.perfil === 'ADMINISTRADOR' && activeAdmins >= MAX_ADMINS) {
    return NextResponse.json({
      error: `Já existe ${MAX_ADMINS} administrador activo. O sistema permite no máximo ${MAX_ADMINS}.`,
    }, { status: 400 });
  }

  if (parsed.data.perfil === 'ATENDENTE' && activeAtendentes >= MAX_ATENDENTES) {
    return NextResponse.json({
      error: `Já existem ${MAX_ATENDENTES} atendentes activos. O sistema permite no máximo ${MAX_ATENDENTES}.`,
    }, { status: 400 });
  }

  const existingUser = await (async () => {
    try {
      return await db.orm.public.Utilizador.where({ email: parsed.data.email }).first();
    } catch {
      const { data } = await supabaseAdmin.from('Utilizador').select('id').ilike('email', parsed.data.email).maybeSingle();
      return data;
    }
  })();

  if (existingUser) {
    return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
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
  } catch {
    const { data, error } = await supabaseAdmin.from('Utilizador').insert({
      nome: parsed.data.nome,
      email: parsed.data.email,
      palavraPasse: passwordHash,
      perfil: parsed.data.perfil,
      activo: parsed.data.activo ?? true,
    }).select().single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Erro ao criar utilizador.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: Number(data.id), nome: data.nome, email: data.email, perfil: data.perfil, activo: data.activo },
    }, { status: 201 });
  }
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

  // Verificar limites ao alterar perfil
  const allUsers = await getAllUsers();
  const existingUser = allUsers.find((u) => u.id === parsed.data.id);

  if (!existingUser) {
    return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
  }

  // Verificar conflito de email
  const emailInUse = allUsers.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase() && u.id !== parsed.data.id);
  if (emailInUse) {
    return NextResponse.json({ error: 'Este email já está em uso por outro utilizador.' }, { status: 409 });
  }

  // Impedir desactivar/rebaixar o último admin activo
  if (existingUser.perfil === 'ADMINISTRADOR' && existingUser.activo) {
    const activeAdmins = allUsers.filter((u) => u.perfil === 'ADMINISTRADOR' && u.activo);

    if (activeAdmins.length <= 1 && (parsed.data.perfil === 'ATENDENTE' || !parsed.data.activo)) {
      return NextResponse.json({ error: 'Não pode remover ou desactivar o último administrador activo.' }, { status: 400 });
    }
  }

  // Verificar limites ao alterar perfil
  if (parsed.data.activo) {
    const activeOfNewProfile = allUsers.filter((u) => u.perfil === parsed.data.perfil && u.activo && u.id !== parsed.data.id).length;

    if (parsed.data.perfil === 'ADMINISTRADOR' && activeOfNewProfile >= MAX_ADMINS) {
      return NextResponse.json({ error: `O sistema permite no máximo ${MAX_ADMINS} administrador activo.` }, { status: 400 });
    }

    if (parsed.data.perfil === 'ATENDENTE' && activeOfNewProfile >= MAX_ATENDENTES) {
      return NextResponse.json({ error: `O sistema permite no máximo ${MAX_ATENDENTES} atendentes activos.` }, { status: 400 });
    }
  }

  try {
    const updatedUser = await db.orm.public.Utilizador.where({ id: parsed.data.id }).update({
      nome: parsed.data.nome,
      email: parsed.data.email,
      perfil: parsed.data.perfil,
      activo: parsed.data.activo,
    });
    return NextResponse.json({ ok: true, user: updatedUser });
  } catch {
    const { data, error } = await supabaseAdmin.from('Utilizador').update({
      nome: parsed.data.nome,
      email: parsed.data.email,
      perfil: parsed.data.perfil,
      activo: parsed.data.activo,
    }).eq('id', parsed.data.id).select().single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Erro ao actualizar.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: data });
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { id } = body as { id?: number };

  if (!id || typeof id !== 'number') {
    return NextResponse.json({ error: 'ID do utilizador é obrigatório.' }, { status: 400 });
  }

  // Não pode remover a si mesmo
  if (id === currentUser.id) {
    return NextResponse.json({ error: 'Não pode desactivar a sua própria conta.' }, { status: 400 });
  }

  const allUsers = await getAllUsers();
  const targetUser = allUsers.find((u) => u.id === id);

  if (!targetUser) {
    return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
  }

  // Impedir desactivar o último admin
  if (targetUser.perfil === 'ADMINISTRADOR' && targetUser.activo) {
    const activeAdmins = allUsers.filter((u) => u.perfil === 'ADMINISTRADOR' && u.activo);
    if (activeAdmins.length <= 1) {
      return NextResponse.json({ error: 'Não pode desactivar o último administrador activo.' }, { status: 400 });
    }
  }

  try {
    await db.orm.public.Utilizador.where({ id }).update({ activo: false });
    return NextResponse.json({ ok: true, message: 'Utilizador desactivado com sucesso.' });
  } catch {
    const { error } = await supabaseAdmin.from('Utilizador').update({ activo: false }).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: 'Utilizador desactivado com sucesso.' });
  }
}
