import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/lib/auth';
import { recordKitchenWaste } from '@/src/lib/blind-count';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const produtoId = Number(body.produtoId);
    const quantidade = Number(body.quantidade);
    const motivo = String(body.motivo ?? '');

    if (!produtoId || produtoId <= 0) {
      return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 });
    }
    if (!quantidade || quantidade <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero.' }, { status: 400 });
    }
    if (!motivo.trim()) {
      return NextResponse.json({ error: 'O motivo da quebra é obrigatório.' }, { status: 400 });
    }

    const resultado = await recordKitchenWaste(currentUser.id, {
      produtoId,
      quantidade,
      motivo,
    });

    return NextResponse.json(
      {
        ok: true,
        mensagem: 'Quebra de cozinha registada com sucesso.',
        movimentoId: resultado.movimento.id,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isConflict = /insuficiente|stock|não encontrado|inactivo/i.test(message);
    return NextResponse.json(
      { error: message || 'Erro ao registar quebra de cozinha.' },
      { status: isConflict ? 409 : 400 }
    );
  }
}
