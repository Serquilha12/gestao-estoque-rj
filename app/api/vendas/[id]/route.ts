import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { getSaleById } from '@/src/lib/sales';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Identificador de venda inválido.' }, { status: 400 });
  }

  const venda = await getSaleById(id, currentUser.id, currentUser.perfil);
  if (!venda) return NextResponse.json({ error: 'Venda não encontrada.' }, { status: 404 });
  return NextResponse.json({ venda });
}
