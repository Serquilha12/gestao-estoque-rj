import 'server-only';

import { db } from '@/src/prisma/db';

export type PeriodFilter = 'hoje' | '7d' | '30d' | 'mes' | 'todos' | 'personalizado';

export type TopSellingProduct = {
  produtoId: number;
  codigo: string;
  nome: string;
  categoriaNome: string;
  quantidadeVendida: number;
  totalFacturado: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
};

export type LowStockProduct = {
  id: number;
  codigo: string;
  nome: string;
  categoriaNome: string;
  stockActual: number;
  stockMinimo: number;
  precoVenda: string;
  activo: boolean;
};

export type DashboardRecentMovement = {
  id: number;
  produtoId: number;
  produtoNome: string;
  produtoCodigo: string;
  utilizadorNome: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  stockAnterior: number;
  stockPosterior: number;
  motivo: string | null;
  criadoEm: string;
};

export type AdminDashboardData = {
  periodo: PeriodFilter;
  dataInicio: string | null;
  dataFim: string | null;
  totalVendasHoje: number;
  totalFacturadoHoje: string;
  totalVendasPeriodo: number;
  totalFacturadoPeriodo: string;
  totalItensVendidosPeriodo: number;
  ticketMedioPeriodo: string;
  produtosMaisVendidos: TopSellingProduct[];
  produtosStockBaixo: LowStockProduct[];
  totalProdutosStockBaixo: number;
  totalProdutosActivos: number;
  totalCategoriasActivas: number;
  movimentosRecentes: DashboardRecentMovement[];
};

export type AttendantDashboardData = {
  periodo: PeriodFilter;
  dataInicio: string | null;
  dataFim: string | null;
  minhasVendasHoje: number;
  meuTotalFacturadoHoje: string;
  minhasVendasPeriodo: number;
  meuTotalFacturadoPeriodo: string;
  meusItensVendidosPeriodo: number;
  produtosStockBaixo: LowStockProduct[];
  totalProdutosStockBaixo: number;
  meusProdutosMaisVendidos: TopSellingProduct[];
};

export function resolveDateRange(options?: {
  periodo?: PeriodFilter | string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}): { periodo: PeriodFilter; start: Date | null; end: Date | null } {
  const rawPeriodo = options?.periodo ?? 'hoje';
  const now = new Date();

  if (options?.dataInicio || options?.dataFim) {
    const start = options.dataInicio ? new Date(options.dataInicio) : null;
    const end = options.dataFim ? new Date(options.dataFim) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    return { periodo: 'personalizado', start, end };
  }

  if (rawPeriodo === 'todos') {
    return { periodo: 'todos', start: null, end: null };
  }

  if (rawPeriodo === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { periodo: '7d', start, end: null };
  }

  if (rawPeriodo === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { periodo: '30d', start, end: null };
  }

  if (rawPeriodo === 'mes') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { periodo: 'mes', start, end: null };
  }

  // Default: 'hoje'
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { periodo: 'hoje', start, end };
}

function parseMoney(val: unknown): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

export async function getTopSellingProducts(options?: {
  limit?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  periodo?: string | null;
  utilizadorId?: number | null;
}): Promise<TopSellingProduct[]> {
  const limit = options?.limit ?? 5;
  const { start, end } = resolveDateRange(options);

  const [vendas, itensVenda, produtos, categorias] = await Promise.all([
    db.orm.public.Venda.select('id', 'utilizadorId', 'criadoEm').all(),
    db.orm.public.ItemVenda.select('id', 'vendaId', 'produtoId', 'quantidade', 'subtotal').all(),
    db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'stockActual', 'stockMinimo', 'activo').all(),
    db.orm.public.Categoria.select('id', 'nome').all(),
  ]);

  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nome]));
  const produtoMap = new Map(produtos.map((p) => [p.id, p]));

  // Filtrar vendas pelo período e utilizador
  const vendaValidaSet = new Set<number>();
  for (const venda of vendas) {
    const dataVenda = new Date(venda.criadoEm);
    if (start && dataVenda < start) continue;
    if (end && dataVenda > end) continue;
    if (options?.utilizadorId && venda.utilizadorId !== options.utilizadorId) continue;
    vendaValidaSet.add(venda.id);
  }

  // Agregar itens de vendas válidas
  const produtoAgregado = new Map<number, { quantidade: number; total: number }>();
  for (const item of itensVenda) {
    if (!vendaValidaSet.has(item.vendaId)) continue;
    const atual = produtoAgregado.get(item.produtoId) ?? { quantidade: 0, total: 0 };
    atual.quantidade += item.quantidade;
    atual.total += parseMoney(item.subtotal);
    produtoAgregado.set(item.produtoId, atual);
  }

  // Ordenar por quantidade decrescente
  const sorted = Array.from(produtoAgregado.entries())
    .sort((a, b) => b[1].quantidade - a[1].quantidade || b[1].total - a[1].total)
    .slice(0, limit);

  return sorted.map(([produtoId, agg]) => {
    const prod = produtoMap.get(produtoId);
    return {
      produtoId,
      codigo: prod?.codigo ?? '-',
      nome: prod?.nome ?? 'Produto Desconhecido',
      categoriaNome: prod ? categoriaMap.get(prod.categoriaId) ?? 'Sem categoria' : '-',
      quantidadeVendida: agg.quantidade,
      totalFacturado: agg.total.toFixed(2),
      stockActual: prod?.stockActual ?? 0,
      stockMinimo: prod?.stockMinimo ?? 0,
      activo: prod?.activo ?? true,
    };
  });
}

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const [produtos, categorias] = await Promise.all([
    db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'precoVenda', 'stockActual', 'stockMinimo', 'activo')
      .orderBy((p) => p.stockActual.asc())
      .all(),
    db.orm.public.Categoria.select('id', 'nome').all(),
  ]);

  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nome]));

  return produtos
    .filter((p) => p.activo && p.stockActual <= p.stockMinimo)
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      categoriaNome: categoriaMap.get(p.categoriaId) ?? 'Sem categoria',
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      precoVenda: String(p.precoVenda),
      activo: p.activo,
    }));
}

export async function getAdminDashboard(options?: {
  periodo?: PeriodFilter | string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}): Promise<AdminDashboardData> {
  const { periodo, start, end } = resolveDateRange(options);

  // Início de hoje para métricas de "hoje"
  const now = new Date();
  const hojeInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const hojeFim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [vendas, itensVenda, produtos, categorias, movimentosRaw, utilizadores] = await Promise.all([
    db.orm.public.Venda.select('id', 'utilizadorId', 'total', 'criadoEm').orderBy((v) => v.criadoEm.desc()).all(),
    db.orm.public.ItemVenda.select('id', 'vendaId', 'produtoId', 'quantidade', 'subtotal').all(),
    db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'precoVenda', 'stockActual', 'stockMinimo', 'activo').all(),
    db.orm.public.Categoria.select('id', 'nome', 'activo').all(),
    db.orm.public.MovimentoStock.select('id', 'produtoId', 'utilizadorId', 'tipo', 'quantidade', 'stockAnterior', 'stockPosterior', 'motivo', 'criadoEm')
      .orderBy((m) => m.criadoEm.desc())
      .all(),
    db.orm.public.Utilizador.select('id', 'nome').all(),
  ]);

  const produtoMap = new Map(produtos.map((p) => [p.id, p]));
  const utilizadorMap = new Map(utilizadores.map((u) => [u.id, u.nome]));
  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nome]));

  let totalVendasHoje = 0;
  let totalFacturadoHojeNum = 0;

  let totalVendasPeriodo = 0;
  let totalFacturadoPeriodoNum = 0;
  const vendasPeriodoIds = new Set<number>();

  for (const venda of vendas) {
    const dataVenda = new Date(venda.criadoEm);
    const valor = parseMoney(venda.total);

    if (dataVenda >= hojeInicio && dataVenda <= hojeFim) {
      totalVendasHoje++;
      totalFacturadoHojeNum += valor;
    }

    const inPeriod = (!start || dataVenda >= start) && (!end || dataVenda <= end);
    if (inPeriod) {
      totalVendasPeriodo++;
      totalFacturadoPeriodoNum += valor;
      vendasPeriodoIds.add(venda.id);
    }
  }

  // Itens vendidos no período
  let totalItensVendidosPeriodo = 0;
  const itensAgregados = new Map<number, { quantidade: number; total: number }>();

  for (const item of itensVenda) {
    if (!vendasPeriodoIds.has(item.vendaId)) continue;
    totalItensVendidosPeriodo += item.quantidade;

    const atual = itensAgregados.get(item.produtoId) ?? { quantidade: 0, total: 0 };
    atual.quantidade += item.quantidade;
    atual.total += parseMoney(item.subtotal);
    itensAgregados.set(item.produtoId, atual);
  }

  const produtosMaisVendidos: TopSellingProduct[] = Array.from(itensAgregados.entries())
    .sort((a, b) => b[1].quantidade - a[1].quantidade || b[1].total - a[1].total)
    .slice(0, 5)
    .map(([produtoId, agg]) => {
      const prod = produtoMap.get(produtoId);
      return {
        produtoId,
        codigo: prod?.codigo ?? '-',
        nome: prod?.nome ?? 'Produto Desconhecido',
        categoriaNome: prod ? categoriaMap.get(prod.categoriaId) ?? 'Sem categoria' : '-',
        quantidadeVendida: agg.quantidade,
        totalFacturado: agg.total.toFixed(2),
        stockActual: prod?.stockActual ?? 0,
        stockMinimo: prod?.stockMinimo ?? 0,
        activo: prod?.activo ?? true,
      };
    });

  const produtosStockBaixo: LowStockProduct[] = produtos
    .filter((p) => p.activo && p.stockActual <= p.stockMinimo)
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      categoriaNome: categoriaMap.get(p.categoriaId) ?? 'Sem categoria',
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      precoVenda: String(p.precoVenda),
      activo: p.activo,
    }));

  const movimentosRecentes: DashboardRecentMovement[] = movimentosRaw.slice(0, 8).map((m) => {
    const prod = produtoMap.get(m.produtoId);
    return {
      id: m.id,
      produtoId: m.produtoId,
      produtoNome: prod?.nome ?? 'Produto Desconhecido',
      produtoCodigo: prod?.codigo ?? '-',
      utilizadorNome: utilizadorMap.get(m.utilizadorId) ?? 'Utilizador',
      tipo: m.tipo as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
      quantidade: m.quantidade,
      stockAnterior: m.stockAnterior,
      stockPosterior: m.stockPosterior,
      motivo: m.motivo,
      criadoEm: m.criadoEm,
    };
  });

  const ticketMedio = totalVendasPeriodo > 0 ? (totalFacturadoPeriodoNum / totalVendasPeriodo).toFixed(2) : '0.00';

  return {
    periodo,
    dataInicio: start ? start.toISOString().slice(0, 10) : null,
    dataFim: end ? end.toISOString().slice(0, 10) : null,
    totalVendasHoje,
    totalFacturadoHoje: totalFacturadoHojeNum.toFixed(2),
    totalVendasPeriodo,
    totalFacturadoPeriodo: totalFacturadoPeriodoNum.toFixed(2),
    totalItensVendidosPeriodo,
    ticketMedioPeriodo: ticketMedio,
    produtosMaisVendidos,
    produtosStockBaixo,
    totalProdutosStockBaixo: produtosStockBaixo.length,
    totalProdutosActivos: produtos.filter((p) => p.activo).length,
    totalCategoriasActivas: categorias.filter((c) => c.activo).length,
    movimentosRecentes,
  };
}

export async function getAttendantDashboard(
  utilizadorId: number,
  options?: {
    periodo?: PeriodFilter | string | null;
    dataInicio?: string | null;
    dataFim?: string | null;
  }
): Promise<AttendantDashboardData> {
  const { periodo, start, end } = resolveDateRange(options);

  const now = new Date();
  const hojeInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const hojeFim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [vendas, itensVenda, produtos, categorias] = await Promise.all([
    db.orm.public.Venda.where({ utilizadorId }).orderBy((v) => v.criadoEm.desc()).all(),
    db.orm.public.ItemVenda.select('id', 'vendaId', 'produtoId', 'quantidade', 'subtotal').all(),
    db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'precoVenda', 'stockActual', 'stockMinimo', 'activo').all(),
    db.orm.public.Categoria.select('id', 'nome').all(),
  ]);

  const produtoMap = new Map(produtos.map((p) => [p.id, p]));
  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nome]));

  let minhasVendasHoje = 0;
  let meuTotalFacturadoHojeNum = 0;

  let minhasVendasPeriodo = 0;
  let meuTotalFacturadoPeriodoNum = 0;
  const minhasVendasPeriodoIds = new Set<number>();

  for (const venda of vendas) {
    const dataVenda = new Date(venda.criadoEm);
    const valor = parseMoney(venda.total);

    if (dataVenda >= hojeInicio && dataVenda <= hojeFim) {
      minhasVendasHoje++;
      meuTotalFacturadoHojeNum += valor;
    }

    const inPeriod = (!start || dataVenda >= start) && (!end || dataVenda <= end);
    if (inPeriod) {
      minhasVendasPeriodo++;
      meuTotalFacturadoPeriodoNum += valor;
      minhasVendasPeriodoIds.add(venda.id);
    }
  }

  let meusItensVendidosPeriodo = 0;
  const itensAgregados = new Map<number, { quantidade: number; total: number }>();

  for (const item of itensVenda) {
    if (!minhasVendasPeriodoIds.has(item.vendaId)) continue;
    meusItensVendidosPeriodo += item.quantidade;

    const atual = itensAgregados.get(item.produtoId) ?? { quantidade: 0, total: 0 };
    atual.quantidade += item.quantidade;
    atual.total += parseMoney(item.subtotal);
    itensAgregados.set(item.produtoId, atual);
  }

  const meusProdutosMaisVendidos: TopSellingProduct[] = Array.from(itensAgregados.entries())
    .sort((a, b) => b[1].quantidade - a[1].quantidade || b[1].total - a[1].total)
    .slice(0, 5)
    .map(([produtoId, agg]) => {
      const prod = produtoMap.get(produtoId);
      return {
        produtoId,
        codigo: prod?.codigo ?? '-',
        nome: prod?.nome ?? 'Produto Desconhecido',
        categoriaNome: prod ? categoriaMap.get(prod.categoriaId) ?? 'Sem categoria' : '-',
        quantidadeVendida: agg.quantidade,
        totalFacturado: agg.total.toFixed(2),
        stockActual: prod?.stockActual ?? 0,
        stockMinimo: prod?.stockMinimo ?? 0,
        activo: prod?.activo ?? true,
      };
    });

  const produtosStockBaixo: LowStockProduct[] = produtos
    .filter((p) => p.activo && p.stockActual <= p.stockMinimo)
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      categoriaNome: categoriaMap.get(p.categoriaId) ?? 'Sem categoria',
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      precoVenda: String(p.precoVenda),
      activo: p.activo,
    }));

  return {
    periodo,
    dataInicio: start ? start.toISOString().slice(0, 10) : null,
    dataFim: end ? end.toISOString().slice(0, 10) : null,
    minhasVendasHoje,
    meuTotalFacturadoHoje: meuTotalFacturadoHojeNum.toFixed(2),
    minhasVendasPeriodo,
    meuTotalFacturadoPeriodo: meuTotalFacturadoPeriodoNum.toFixed(2),
    meusItensVendidosPeriodo,
    produtosStockBaixo,
    totalProdutosStockBaixo: produtosStockBaixo.length,
    meusProdutosMaisVendidos,
  };
}
