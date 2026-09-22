import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { setProductStatus } from '@/src/lib/catalog';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const form = await request.formData();
  const id = Number((await params).id);
  const activo = form.get('activo') === 'true';

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Identificador de produto inválido.' }, { status: 400 });
  }

  try {
    await setProductStatus(id, activo);
    return NextResponse.redirect(new URL('/app/admin/produtos', request.url), 303);
  } catch {
    return NextResponse.json({ error: 'Não foi possível alterar o estado do produto.' }, { status: 400 });
  }
}
