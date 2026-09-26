import 'server-only';

import { db, canUsePrisma, reportPrismaSuccess, reportPrismaFailure } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
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

  // 1. Tentar primeiro via Prisma ORM (se disponível)
  if (canUsePrisma()) {
    try {
      const res = await db.transaction(async (tx) => {
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
        metodoPagamento: parsed.data.metodoPagamento,
        valorRecebido: parsed.data.valorRecebido,
        troco: parsed.data.troco,
        referenciaPagamento: parsed.data.referenciaPagamento,
        observacoes: parsed.data.observacoes,
        itens: calculados,
      };
    });
    reportPrismaSuccess();
    return res;
  } catch (err) {
      if (err instanceof Error && (err.message.includes('não encontrado') || err.message.includes('inactivo') || err.message.includes('insuficiente'))) {
        throw err;
      }
      reportPrismaFailure(err);
    }
  }

  // 2. Supabase REST (execução direta e instantânea ~40ms)
  const { data: produtosRaw } = await supabaseAdmin
      .from('Produto')
      .select('id, codigo, nome, precoVenda, stockActual, activo');

    const produtos = produtosRaw ?? [];
    const produtoPorId = new Map(produtos.map((p) => [Number(p.id), p]));
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
      const currentStock = Number(produto.stockActual);
      if (currentStock < quantidade) {
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

    const { data: venda, error: vendaErr } = await supabaseAdmin
      .from('Venda')
      .insert({
        utilizadorId,
        total: total.toFixed(2),
      })
      .select()
      .single();

    if (vendaErr || !venda) throw new Error(vendaErr?.message || 'Erro ao registar venda.');

    for (const item of calculados) {
      await supabaseAdmin.from('ItemVenda').insert({
        vendaId: venda.id,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal: item.subtotal,
      });

      const prod = produtoPorId.get(item.produtoId);
      const prevStock = Number(prod?.stockActual ?? 0);
      const postStock = Math.max(0, prevStock - item.quantidade);

      await supabaseAdmin
        .from('Produto')
        .update({ stockActual: postStock })
        .eq('id', item.produtoId);

      await supabaseAdmin.from('MovimentoStock').insert({
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
      id: Number(venda.id),
      total: total.toFixed(2),
      metodoPagamento: parsed.data.metodoPagamento,
      valorRecebido: parsed.data.valorRecebido,
      troco: parsed.data.troco,
      referenciaPagamento: parsed.data.referenciaPagamento,
      observacoes: parsed.data.observacoes,
      itens: calculados,
    };
  }

export async function getSales(utilizadorId: number, perfil: 'ADMINISTRADOR' | 'ATENDENTE') {
  let vendas: any[] = [];
  let utilizadores: any[] = [];

  // 1. Tentar primeiro via Prisma ORM (se disponível)
  if (canUsePrisma()) {
    try {
      vendas = await db.orm.public.Venda.select('id', 'utilizadorId', 'total', 'criadoEm').orderBy((venda) => venda.criadoEm.desc()).all();
      utilizadores = await db.orm.public.Utilizador.select('id', 'nome').all();
      reportPrismaSuccess();
    } catch (err) {
      reportPrismaFailure(err);
    }
  }

  // 2. Supabase REST fallback direto
  if (vendas.length === 0 && !canUsePrisma()) {
    try {
      const [vRes, uRes] = await Promise.all([
        supabaseAdmin.from('Venda').select('id, utilizadorId, total, criadoEm').order('criadoEm', { ascending: false }),
        supabaseAdmin.from('Utilizador').select('id, nome'),
      ]);
      vendas = vRes.data ?? [];
      utilizadores = uRes.data ?? [];
    } catch {
      vendas = [];
    }
  }

  const filtered = perfil === 'ATENDENTE' ? vendas.filter((venda) => Number(venda.utilizadorId) === utilizadorId) : vendas;

  return filtered.map((venda) => ({
    id: Number(venda.id),
    utilizadorId: Number(venda.utilizadorId),
    total: String(venda.total),
    criadoEm: String(venda.criadoEm),
    utilizadorNome: utilizadores.find((utilizador) => Number(utilizador.id) === Number(venda.utilizadorId))?.nome ?? 'Utilizador',
  }));
}

export type SaleDetailItem = {
  id: number;
  vendaId: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: string;
  subtotal: string;
  produto?: {
    id: number;
    codigo: string;
    nome: string;
  };
};

export type SaleDetail = {
  id: number;
  utilizadorId: number;
  total: string;
  criadoEm: string;
  utilizadorNome: string;
  itens: SaleDetailItem[];
};

export async function getSaleById(id: number, utilizadorId: number, perfil: 'ADMINISTRADOR' | 'ATENDENTE'): Promise<SaleDetail | null> {
  // 1. Tentar primeiro via Prisma ORM (se disponível)
  if (canUsePrisma()) {
    try {
      const venda = await db.orm.public.Venda.where({ id }).first();
      if (!venda || (perfil === 'ATENDENTE' && venda.utilizadorId !== utilizadorId)) return null;

      const itens = await db.orm.public.ItemVenda.where({ vendaId: id }).all();
      const produtos = await db.orm.public.Produto.select('id', 'codigo', 'nome').all();
      const utilizador = await db.orm.public.Utilizador.where({ id: venda.utilizadorId }).first();

      reportPrismaSuccess();
      return {
        id: Number(venda.id),
        utilizadorId: Number(venda.utilizadorId),
        total: String(venda.total),
        criadoEm: String(venda.criadoEm),
        utilizadorNome: utilizador?.nome ?? 'Utilizador',
        itens: itens.map((item) => ({
          id: Number(item.id),
          vendaId: Number(item.vendaId),
          produtoId: Number(item.produtoId),
          quantidade: Number(item.quantidade),
          precoUnitario: String(item.precoUnitario),
          subtotal: String(item.subtotal),
          produto: produtos.find((produto) => produto.id === item.produtoId),
        })),
      };
    } catch (err) {
      reportPrismaFailure(err);
    }
  }

  // 2. Fallback Supabase REST direto (~30ms)
  try {
      const { data: vData } = await supabaseAdmin.from('Venda').select('*').eq('id', id).maybeSingle();
      if (!vData || (perfil === 'ATENDENTE' && Number(vData.utilizadorId) !== utilizadorId)) return null;

      const [iRes, pRes, uRes] = await Promise.all([
        supabaseAdmin.from('ItemVenda').select('*').eq('vendaId', id),
        supabaseAdmin.from('Produto').select('id, codigo, nome'),
        supabaseAdmin.from('Utilizador').select('id, nome').eq('id', vData.utilizadorId).maybeSingle(),
      ]);

      const itemsList = iRes.data ?? [];
      const prodList = pRes.data ?? [];

      return {
        id: Number(vData.id),
        utilizadorId: Number(vData.utilizadorId),
        total: String(vData.total),
        criadoEm: String(vData.criadoEm),
        utilizadorNome: uRes.data?.nome ?? 'Utilizador',
        itens: itemsList.map((item) => ({
          id: Number(item.id),
          vendaId: Number(item.vendaId),
          produtoId: Number(item.produtoId),
          quantidade: Number(item.quantidade),
          precoUnitario: String(item.precoUnitario),
          subtotal: String(item.subtotal),
          produto: prodList.find((p) => Number(p.id) === Number(item.produtoId)),
        })),
      };
    } catch {
      return null;
    }
  }
