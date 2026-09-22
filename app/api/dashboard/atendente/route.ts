import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { getAttendantDashboard } from '@/src/lib/reports';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  try {
    const dashboard = await getAttendantDashboard(currentUser.id, {
      periodo,
      dataInicio,
      dataFim,
    });

    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar o dashboard do atendente.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
