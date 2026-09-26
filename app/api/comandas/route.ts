import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/lib/auth';
import { createComanda, getComandas } from '@/src/lib/comandas';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') as 'ABERTA' | 'FINALIZADA' | 'CANCELADA' | null;

  try {
    const comandas = await getComandas(statusParam ?? 'ABERTA');
    return NextResponse.json({ ok: true, comandas });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Erro ao carregar comandas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { numeroMesa, nomeCliente, observacoes, itens } = body;

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: 'A comanda deve conter pelo menos um item.' },
        { status: 400 }
      );
    }

    const comanda = await createComanda(currentUser.id, {
      numeroMesa,
      nomeCliente,
      observacoes,
      itens,
    });

    return NextResponse.json(
      {
        ok: true,
        mensagem: `Comanda #${comanda.numero} aberta com sucesso!`,
        comanda,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Erro ao abrir comanda.' },
      { status: 400 }
    );
  }
}
