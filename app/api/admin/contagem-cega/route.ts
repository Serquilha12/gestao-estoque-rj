import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/lib/auth';
import { getBlindCounts, getBlindCountById, homologateBlindCount } from '@/src/lib/blind-count';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const contagem = await getBlindCountById(id);
    if (!contagem) {
      return NextResponse.json({ error: 'Contagem não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ contagem });
  }

  const contagens = await getBlindCounts();
  return NextResponse.json({ contagens });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? '');

    if (!id) {
      return NextResponse.json({ error: 'ID da contagem é obrigatório.' }, { status: 400 });
    }

    const homologada = await homologateBlindCount(id, currentUser.id);

    return NextResponse.json({
      ok: true,
      mensagem: `Contagem #${homologada.numero} homologada com sucesso. Estoques sincronizados.`,
      contagem: homologada,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Erro ao homologar contagem cega.' },
      { status: 400 }
    );
  }
}
