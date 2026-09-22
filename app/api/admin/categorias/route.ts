import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { createCategory, getCategories, updateCategory } from '@/src/lib/catalog';
import { categoryCreateSchema, categoryUpdateSchema } from '@/src/lib/validators';

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json().catch(() => ({}));
  }

  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const estado = searchParams.get('estado');
  const activo = estado === 'activo' ? true : estado === 'inactivo' ? false : null;

  const categorias = await getCategories({ search, activo });
  return NextResponse.json({ categorias });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await readBody(request);
  if (body.id !== undefined) {
    const updateParsed = categoryUpdateSchema.safeParse({
      ...body,
      id: Number(body.id),
      activo: body.activo === true || body.activo === 'true',
    });

    if (!updateParsed.success) {
      return NextResponse.json({ error: updateParsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
    }

    try {
      const category = await updateCategory(updateParsed.data);
      if (!request.headers.get('content-type')?.includes('application/json')) {
        return NextResponse.redirect(new URL('/app/admin/categorias', request.url));
      }
      return NextResponse.json({ ok: true, categoria: category });
    } catch {
      return NextResponse.json({ error: 'Não foi possível actualizar a categoria.' }, { status: 400 });
    }
  }

  const parsed = categoryCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const existingCategories = await getCategories({ search: parsed.data.nome });
    if (existingCategories.some((category) => category.nome.trim().toLocaleLowerCase() === parsed.data.nome.trim().toLocaleLowerCase())) {
      return NextResponse.json({ error: 'Já existe uma categoria com este nome.' }, { status: 409 });
    }

    const category = await createCategory(parsed.data);
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.redirect(new URL('/app/admin/categorias', request.url), 303);
    }
    return NextResponse.json({ ok: true, categoria: category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const duplicate = /já existe|unique|duplicate|únic/i.test(message);
    const safeMessage = duplicate ? 'Já existe uma categoria com este nome.' : 'Não foi possível criar a categoria.';
    return NextResponse.json({ error: safeMessage }, { status: duplicate ? 409 : 400 });
  }
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await readBody(request);
  const parsed = categoryUpdateSchema.safeParse({
    ...body,
    id: Number(body.id),
    activo: body.activo === true || body.activo === 'true',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const updatedCategory = await updateCategory(parsed.data);

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.redirect(new URL('/app/admin/categorias', request.url), 303);
    }
    return NextResponse.json({ ok: true, categoria: updatedCategory });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível atualizar a categoria.';
    const duplicate = /já existe|unique|duplicate|únic/i.test(message);
    const status = duplicate ? 409 : message.includes('não encontrada') ? 404 : 400;
    return NextResponse.json({ error: duplicate ? 'Já existe uma categoria com este nome.' : 'Não foi possível actualizar a categoria.' }, { status });
  }
}
