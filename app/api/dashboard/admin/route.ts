import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { getAdminDashboard } from '@/src/lib/reports';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  try {
    const dashboard = await getAdminDashboard({
      periodo,
      dataInicio,
      dataFim,
    });

    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar o dashboard administrativo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
