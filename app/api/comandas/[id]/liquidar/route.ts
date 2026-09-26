import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/lib/auth';
import { settleComanda } from '@/src/lib/comandas';
import { formatDateTimeMaputo } from '@/src/lib/date';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { metodoPagamento, valorRecebido, troco, referenciaPagamento } = body;

  if (!metodoPagamento) {
    return NextResponse.json(
      { error: 'O método de pagamento é obrigatório para liquidação.' },
      { status: 400 }
    );
  }

  try {
    const { comanda, vendaId } = await settleComanda(id, currentUser.id, {
      metodoPagamento,
      valorRecebido: valorRecebido ? Number(valorRecebido) : undefined,
      troco: troco ? Number(troco) : undefined,
      referenciaPagamento,
    });

    const receipt = {
      id: vendaId,
      comandaNumero: comanda.numero,
      numeroMesa: comanda.numeroMesa,
      clienteNome: comanda.nomeCliente,
      dataHora: formatDateTimeMaputo(new Date()),
      atendenteNome: currentUser.nome,
      metodoPagamento,
      valorRecebido,
      troco,
      referenciaPagamento,
      total: comanda.total,
      itens: comanda.itens.map((it) => ({
        id: it.produtoId,
        nome: it.nome,
        quantidade: it.quantidade,
        precoVenda: it.precoUnitario,
        notas: it.notas,
      })),
    };

    return NextResponse.json({
      ok: true,
      mensagem: `Comanda #${comanda.numero} liquidada com sucesso! Venda #${vendaId} gerada.`,
      comanda,
      vendaId,
      receipt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Erro ao liquidar comanda.' },
      { status: 400 }
    );
  }
}
