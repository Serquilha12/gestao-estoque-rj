import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { getTopSellingProducts } from '@/src/lib/reports';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 50) : 10;
  const periodo = searchParams.get('periodo');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  try {
    const produtos = await getTopSellingProducts({
      limit,
      periodo,
      dataInicio,
      dataFim,
    });

    return NextResponse.json({ produtos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar os produtos mais vendidos.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
