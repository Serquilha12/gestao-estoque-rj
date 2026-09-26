import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/lib/auth';
import {
  getComandaById,
  addItemToComanda,
  cancelComanda,
} from '@/src/lib/comandas';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const comanda = await getComandaById(id);

  if (!comanda) {
    return NextResponse.json({ error: 'Comanda não encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, comanda });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { action, motivo, itens } = body;

  try {
    if (action === 'cancelar') {
      const cancelada = await cancelComanda(id, currentUser.id, motivo);
      return NextResponse.json({
        ok: true,
        mensagem: `Comanda #${cancelada.numero} cancelada e itens devolvidos ao stock.`,
        comanda: cancelada,
      });
    }

    if (action === 'adicionar_itens') {
      if (!Array.isArray(itens) || itens.length === 0) {
        return NextResponse.json({ error: 'Informe ao menos um produto a adicionar.' }, { status: 400 });
      }
      const actualizada = await addItemToComanda(id, currentUser.id, itens);
      return NextResponse.json({
        ok: true,
        mensagem: 'Itens adicionados à comanda com sucesso!',
        comanda: actualizada,
      });
    }

    return NextResponse.json({ error: 'Acção inválida.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Erro ao processar comanda.' },
      { status: 400 }
    );
  }
}
