import 'server-only';

import { db } from '@/src/prisma/db';
import { saleCreateSchema, type SaleCreateInput } from '@/src/lib/validators';

export type SaleCartItem = {
  produtoId: number;
  quantidade: number;
};

function money(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Preço de produto inválido.');
  }
  return parsed;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function createSale(utilizadorId: number, input: SaleCreateInput) {
  const parsed = saleCreateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Itens de venda inválidos.');
  }

  const itens = new Map<number, number>();
  for (const item of parsed.data.itens) {
    itens.set(item.produtoId, (itens.get(item.produtoId) ?? 0) + item.quantidade);
  }

  return db.transaction(async (tx) => {
    const produtos = await tx.orm.public.Produto.select(
      'id', 'codigo', 'nome', 'precoVenda', 'stockActual', 'activo',
    ).all();
    const produtoPorId = new Map(produtos.map((produto) => [produto.id, produto]));
    const calculados: Array<{
      produtoId: number;
      quantidade: number;
      precoUnitario: string;
      subtotal: string;
    }> = [];
    let total = 0;

    for (const [produtoId, quantidade] of itens) {
      const produto = produtoPorId.get(produtoId);
      if (!produto) throw new Error('Produto não encontrado.');
      if (!produto.activo) throw new Error(`O produto ${produto.nome} está inactivo.`);
      if (produto.stockActual < quantidade) {
        throw new Error(`Stock insuficiente para o produto ${produto.nome}.`);
      }

      const preco = money(produto.precoVenda);
      const subtotal = roundMoney(preco * quantidade);
      total = roundMoney(total + subtotal);
      calculados.push({
        produtoId,
        quantidade,
        precoUnitario: preco.toFixed(2),
        subtotal: subtotal.toFixed(2),
      });
    }

    const venda = await tx.orm.public.Venda.create({
      utilizadorId,
      total: total.toFixed(2),
    });

    for (const item of calculados) {
      await tx.orm.public.ItemVenda.create({
        vendaId: venda.id,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal: item.subtotal,
      });

      const updatePlan = tx.sql.public.produto
        .update((fields, fns) => ({
          stockActual: fns.raw`${fields.stockActual} - ${item.quantidade}`.returns('pg/int4@1'),
        }))
        .where((fields, fns) => fns.and(
          fns.eq(fields.id, item.produtoId),
          fns.gte(fields.stockActual, item.quantidade),
        ))
        .returning('id', 'stockActual')
        .build();
      const updated = await tx.query(updatePlan);

      if (updated.length !== 1) {
        throw new Error('Stock insuficiente para concluir a venda.');
      }

      const postStock = updated[0]!.stockActual;
      const prevStock = postStock + item.quantidade;

      await tx.orm.public.MovimentoStock.create({
        produtoId: item.produtoId,
        utilizadorId,
        tipo: 'SAIDA',
        quantidade: item.quantidade,
        stockAnterior: prevStock,
        stockPosterior: postStock,
        motivo: `Venda #${venda.id}`,
      });
    }

    return {
      id: venda.id,
      total: total.toFixed(2),
      itens: calculados,
    };
  });
}

export async function getSales(utilizadorId: number, perfil: 'ADMINISTRADOR' | 'ATENDENTE') {
  const vendas = await db.orm.public.Venda.select('id', 'utilizadorId', 'total', 'criadoEm').orderBy((venda) => venda.criadoEm.desc()).all();
  const filtered = perfil === 'ATENDENTE' ? vendas.filter((venda) => venda.utilizadorId === utilizadorId) : vendas;
  const utilizadores = await db.orm.public.Utilizador.select('id', 'nome').all();

  return filtered.map((venda) => ({
    ...venda,
    utilizadorNome: utilizadores.find((utilizador) => utilizador.id === venda.utilizadorId)?.nome ?? 'Utilizador',
  }));
}

export async function getSaleById(id: number, utilizadorId: number, perfil: 'ADMINISTRADOR' | 'ATENDENTE') {
  const venda = await db.orm.public.Venda.where({ id }).first();
  if (!venda || (perfil === 'ATENDENTE' && venda.utilizadorId !== utilizadorId)) return null;

  const itens = await db.orm.public.ItemVenda.where({ vendaId: id }).all();
  const produtos = await db.orm.public.Produto.select('id', 'codigo', 'nome').all();
  const utilizador = await db.orm.public.Utilizador.where({ id: venda.utilizadorId }).first();

  return {
    ...venda,
    utilizadorNome: utilizador?.nome ?? 'Utilizador',
    itens: itens.map((item) => ({
      ...item,
      produto: produtos.find((produto) => produto.id === item.produtoId),
    })),
  };
}
