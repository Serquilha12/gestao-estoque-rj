import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { recordStockAdjustment } from '@/src/lib/stock';

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json().catch(() => ({}));
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const rawBody = await readBody(request);
  const body = {
    produtoId: Number(rawBody.produtoId),
    novoStock: Number(rawBody.novoStock),
    motivo: String(rawBody.motivo ?? ''),
  };

  try {
    const result = await recordStockAdjustment(currentUser.id, body);

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.redirect(new URL('/app/admin/stock', request.url), 303);
    }

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isConflict = /inactivo|inativo|não encontrado/i.test(message);
    const isValidation = /inválid|motivo|negativo|inteiro/i.test(message);
    const status = isValidation ? 400 : isConflict ? 409 : 400;

    return NextResponse.json({ error: message || 'Não foi possível registar o ajuste de stock.' }, { status });
  }
}
