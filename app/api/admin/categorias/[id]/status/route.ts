import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { setCategoryStatus } from '@/src/lib/catalog';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const form = await request.formData();
  const activo = form.get('activo') === 'true';
  const id = Number((await params).id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Identificador de categoria inválido.' }, { status: 400 });
  }

  try {
    await setCategoryStatus(id, activo);
    return NextResponse.redirect(new URL('/app/admin/categorias', request.url), 303);
  } catch {
    return NextResponse.json({ error: 'Não foi possível alterar o estado da categoria.' }, { status: 400 });
  }
}