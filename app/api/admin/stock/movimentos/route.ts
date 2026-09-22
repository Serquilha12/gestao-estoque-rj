import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { getStockMovements } from '@/src/lib/stock';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const produtoParam = searchParams.get('produtoId');
  const tipoParam = searchParams.get('tipo');
  const userParam = searchParams.get('utilizadorId');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  const tipo = tipoParam === 'ENTRADA' || tipoParam === 'SAIDA' || tipoParam === 'AJUSTE' ? tipoParam : null;

  try {
    const movimentos = await getStockMovements({
      produtoId: produtoParam ? Number(produtoParam) : null,
      tipo,
      utilizadorId: userParam ? Number(userParam) : null,
      dataInicio,
      dataFim,
    });

    return NextResponse.json({ movimentos });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Erro ao consultar movimentos de stock.' }, { status: 500 });
  }
}
