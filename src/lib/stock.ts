import 'server-only';

import { db } from '@/src/prisma/db';
import {
  stockAdjustmentSchema,
  stockEntrySchema,
  stockExitSchema,
  type StockAdjustmentInput,
  type StockEntryInput,
  type StockExitInput,
} from '@/src/lib/validators';

export type StockMovementListItem = {
  id: number;
  produtoId: number;
  produtoNome: string;
  produtoCodigo: string;
  utilizadorId: number;
  utilizadorNome: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  stockAnterior: number;
  stockPosterior: number;
  motivo: string | null;
  criadoEm: string;
};

export async function recordStockEntry(utilizadorId: number, input: StockEntryInput) {
  const parsed = stockEntrySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados de entrada de stock inválidos.');
  }

  return db.transaction(async (tx) => {
    const produto = await tx.orm.public.Produto.where({ id: parsed.data.produtoId }).first();
    if (!produto) {
      throw new Error('Produto não encontrado.');
    }
    if (!produto.activo) {
      throw new Error(`O produto ${produto.nome} está inactivo.`);
    }

    const stockAnterior = produto.stockActual;
    const stockPosterior = stockAnterior + parsed.data.quantidade;

    await tx.orm.public.Produto.where({ id: produto.id }).update({
      stockActual: stockPosterior,
    });

    const movimento = await tx.orm.public.MovimentoStock.create({
      produtoId: produto.id,
      utilizadorId,
      tipo: 'ENTRADA',
      quantidade: parsed.data.quantidade,
      stockAnterior,
      stockPosterior,
      motivo: parsed.data.motivo ?? 'Entrada manual de stock',
    });

    return {
      movimento,
      produto: {
        id: produto.id,
        stockActual: stockPosterior,
      },
    };
  });
}

export async function recordStockExit(utilizadorId: number, input: StockExitInput) {
  const parsed = stockExitSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados de saída de stock inválidos.');
  }

  return db.transaction(async (tx) => {
    const produto = await tx.orm.public.Produto.where({ id: parsed.data.produtoId }).first();
    if (!produto) {
      throw new Error('Produto não encontrado.');
    }
    if (!produto.activo) {
      throw new Error(`O produto ${produto.nome} está inactivo.`);
    }
    if (produto.stockActual < parsed.data.quantidade) {
      throw new Error(`Stock insuficiente para o produto ${produto.nome}.`);
    }

    const stockAnterior = produto.stockActual;
    const stockPosterior = stockAnterior - parsed.data.quantidade;

    const updatePlan = tx.sql.public.produto
      .update((fields, fns) => ({
        stockActual: fns.raw`${fields.stockActual} - ${parsed.data.quantidade}`.returns('pg/int4@1'),
      }))
      .where((fields, fns) => fns.and(
        fns.eq(fields.id, produto.id),
        fns.gte(fields.stockActual, parsed.data.quantidade),
      ))
      .returning('id', 'stockActual')
      .build();
    const updated = await tx.query(updatePlan);

    if (updated.length !== 1) {
      throw new Error('Stock insuficiente para concluir a saída.');
    }

    const movimento = await tx.orm.public.MovimentoStock.create({
      produtoId: produto.id,
      utilizadorId,
      tipo: 'SAIDA',
      quantidade: parsed.data.quantidade,
      stockAnterior,
      stockPosterior,
      motivo: parsed.data.motivo ?? 'Saída manual de stock',
    });

    return {
      movimento,
      produto: {
        id: produto.id,
        stockActual: stockPosterior,
      },
    };
  });
}

export async function recordStockAdjustment(utilizadorId: number, input: StockAdjustmentInput) {
  const parsed = stockAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados de ajuste de stock inválidos.');
  }

  return db.transaction(async (tx) => {
    const produto = await tx.orm.public.Produto.where({ id: parsed.data.produtoId }).first();
    if (!produto) {
      throw new Error('Produto não encontrado.');
    }
    if (!produto.activo) {
      throw new Error(`O produto ${produto.nome} está inactivo.`);
    }

    const stockAnterior = produto.stockActual;
    const stockPosterior = parsed.data.novoStock;
    const diferenca = stockPosterior - stockAnterior;

    await tx.orm.public.Produto.where({ id: produto.id }).update({
      stockActual: stockPosterior,
    });

    const movimento = await tx.orm.public.MovimentoStock.create({
      produtoId: produto.id,
      utilizadorId,
      tipo: 'AJUSTE',
      quantidade: Math.abs(diferenca),
      stockAnterior,
      stockPosterior,
      motivo: parsed.data.motivo,
    });

    return {
      movimento,
      produto: {
        id: produto.id,
        stockActual: stockPosterior,
      },
    };
  });
}

export async function getStockMovements(filters?: {
  produtoId?: number | null;
  tipo?: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | null;
  utilizadorId?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}) {
  const movimentos = await db.orm.public.MovimentoStock
    .select('id', 'produtoId', 'utilizadorId', 'tipo', 'quantidade', 'stockAnterior', 'stockPosterior', 'motivo', 'criadoEm')
    .orderBy((m) => m.criadoEm.desc())
    .all();

  const [produtos, utilizadores] = await Promise.all([
    db.orm.public.Produto.select('id', 'codigo', 'nome').all(),
    db.orm.public.Utilizador.select('id', 'nome').all(),
  ]);

  const produtoMap = new Map(produtos.map((p) => [p.id, p]));
  const utilizadorMap = new Map(utilizadores.map((u) => [u.id, u]));

  return movimentos
    .map((m) => {
      const prod = produtoMap.get(m.produtoId);
      const user = utilizadorMap.get(m.utilizadorId);

      return {
        id: m.id,
        produtoId: m.produtoId,
        produtoNome: prod?.nome ?? 'Produto Removido',
        produtoCodigo: prod?.codigo ?? '-',
        utilizadorId: m.utilizadorId,
        utilizadorNome: user?.nome ?? 'Utilizador Desconhecido',
        tipo: m.tipo as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
        quantidade: m.quantidade,
        stockAnterior: m.stockAnterior,
        stockPosterior: m.stockPosterior,
        motivo: m.motivo,
        criadoEm: m.criadoEm,
      } satisfies StockMovementListItem;
    })
    .filter((m) => {
      if (filters?.produtoId !== undefined && filters.produtoId !== null && m.produtoId !== filters.produtoId) {
        return false;
      }
      if (filters?.tipo !== undefined && filters.tipo !== null && m.tipo !== filters.tipo) {
        return false;
      }
      if (filters?.utilizadorId !== undefined && filters.utilizadorId !== null && m.utilizadorId !== filters.utilizadorId) {
        return false;
      }
      if (filters?.dataInicio && new Date(m.criadoEm) < new Date(filters.dataInicio)) {
        return false;
      }
      if (filters?.dataFim && new Date(m.criadoEm) > new Date(filters.dataFim)) {
        return false;
      }
      return true;
    });
}
