import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/lib/auth';
import { db } from '@/src/prisma/db';
import { submitBlindCount } from '@/src/lib/blind-count';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  // PRD 5.1: Atendentes não visualizam estoque do sistema nem preços/custos
  const produtos = await db.orm.public.Produto.where({ activo: true }).all();
  const categorias = await db.orm.public.Categoria.all();
  const categoriasMap = new Map(categorias.map((c) => [c.id, c.nome]));

  const listaCega = produtos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nome: p.nome,
    categoriaNome: categoriasMap.get(p.categoriaId) ?? 'Geral',
  }));

  return NextResponse.json({ produtos: listaCega });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const turno = body.turno || 'GERAL';
    const observacoes = body.observacoes || null;
    const itens = Array.isArray(body.itens) ? body.itens : [];

    if (itens.length === 0) {
      return NextResponse.json({ error: 'A contagem deve conter pelo menos um produto.' }, { status: 400 });
    }

    const itensValidados = itens.map((item: { produtoId?: unknown; quantidadeFisica?: unknown; notas?: unknown }) => {
      const produtoId = Number(item.produtoId);
      const quantidadeFisica = Number(item.quantidadeFisica);
      if (!produtoId || produtoId <= 0) {
        throw new Error('Identificador de produto inválido na contagem.');
      }
      if (Number.isNaN(quantidadeFisica) || quantidadeFisica < 0) {
        throw new Error('A quantidade física não pode ser negativa.');
      }
      return {
        produtoId,
        quantidadeFisica: Math.floor(quantidadeFisica),
        notas: typeof item.notas === 'string' ? item.notas.trim() : null,
      };
    });

    const resultado = await submitBlindCount(currentUser.id, {
      turno,
      observacoes,
      itens: itensValidados,
    });

    return NextResponse.json(
      {
        ok: true,
        mensagem: 'Contagem cega submetida com sucesso para auditoria do gerente.',
        contagemId: resultado.id,
        numero: resultado.numero,
        totalItensContados: resultado.totalItensContados,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Erro ao submeter contagem cega.' },
      { status: 400 }
    );
  }
}
