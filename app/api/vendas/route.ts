import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { createSale, getSales } from '@/src/lib/sales';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const vendas = await getSales(currentUser.id, currentUser.perfil);
  return NextResponse.json({ vendas });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const venda = await createSale(currentUser.id, body);
    return NextResponse.json({ ok: true, venda }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const validation = /inválid|vazio|inteiro|maior que zero/i.test(message);
    const conflict = /stock|inactivo|inativo|insuficiente|não encontrado/i.test(message);
    return NextResponse.json(
      { error: message || 'Não foi possível concluir a venda.' },
      { status: validation ? 400 : conflict ? 409 : 400 },
    );
  }
}
