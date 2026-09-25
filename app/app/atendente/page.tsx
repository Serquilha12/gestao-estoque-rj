import { requireRole } from '@/src/lib/auth';
import { getAttendantDashboard, type PeriodFilter } from '@/src/lib/reports';
import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  SalesIcon,
  ProductsIcon,
  CheckCircleIcon,
  PlusIcon,
  HistoryIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
} from '@/src/components/ui/icons';
import { AttendantQuickActions } from '@/src/components/operations/attendant-quick-actions';

export default async function AtendentePage({
  searchParams,
}: {
  searchParams?: Promise<{
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
  }>;
}) {
  const user = await requireRole('ATENDENTE', '/login');
  const params = searchParams ? await searchParams : {};
  const periodo: PeriodFilter =
    params.periodo === '7d' ||
    params.periodo === '30d' ||
    params.periodo === 'mes' ||
    params.periodo === 'todos' ||
    params.periodo === 'personalizado'
      ? params.periodo
      : 'hoje';

  const dataInicio = params.dataInicio ?? '';
  const dataFim = params.dataFim ?? '';

  const data = await getAttendantDashboard(user.id, {
    periodo,
    dataInicio: dataInicio || null,
    dataFim: dataFim || null,
  });

  const periodLabels: Record<string, string> = {
    hoje: 'Hoje',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    mes: 'Este mês',
    todos: 'Todo o histórico',
    personalizado: 'Personalizado',
  };

  const ticketMedio =
    data.minhasVendasPeriodo > 0
      ? (Number(data.meuTotalFacturadoPeriodo) / data.minhasVendasPeriodo).toFixed(2)
      : '0.00';

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO & AÇÕES RÁPIDAS (JOBGIO MONOCHROME)                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Ponto de Atendimento</Badge>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {periodLabels[periodo]}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Painel Operacional
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Bem-vindo, <span className="font-semibold text-zinc-900 dark:text-zinc-200">{user.nome}</span>. Registo ágil de vendas e consulta de stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AttendantQuickActions />

          <Link
            href="/app/vendas"
            className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-4.5 py-2 text-xs font-bold text-white dark:text-black shadow-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
          >
            <PlusIcon size={14} />
            <span>Iniciar Venda (PDV)</span>
          </Link>

          <Link
            href="/app/vendas/historico"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#121824] px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition shadow-2xs"
          >
            <HistoryIcon size={14} />
            <span>Minhas Vendas</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE FILTROS (PILL SWITCHER MINIMALISTA)                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Período:
            </span>
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 p-1">
              {[
                { key: 'hoje', label: 'Hoje' },
                { key: '7d', label: '7 Dias' },
                { key: 'mes', label: 'Este Mês' },
                { key: 'todos', label: 'Todo o Histórico' },
              ].map((p) => {
                const active = periodo === p.key;
                return (
                  <Link
                    key={p.key}
                    href={`/app/atendente?periodo=${p.key}`}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <Link
            href="/app/admin/produtos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <ProductsIcon size={14} />
            <span>Consultar Catálogo de Produtos</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BENTO GRID: MÉTRICAS OPERACIONAIS DO ATENDENTE                         */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Minha Facturação */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Minha Facturação ({periodLabels[periodo]})
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <SalesIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            {Number(data.meuTotalFacturadoPeriodo).toLocaleString('pt-PT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-semibold text-zinc-500">MT</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Total arrecadado nas suas vendas
          </p>
        </div>

        {/* Vendas Concluídas */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Vendas Registadas
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <CheckCircleIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            {data.minhasVendasPeriodo}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Atendimentos fechados com sucesso
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Meu Ticket Médio
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <HistoryIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            {Number(ticketMedio).toLocaleString('pt-PT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-semibold text-zinc-500">MT</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Média por pedido atendido
          </p>
        </div>

        {/* Artigos Vendidos */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Artigos Despachados
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <ProductsIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            {data.meusItensVendidosPeriodo}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Unidades vendidas no período
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO DUPLA: PRODUTOS MAIS VENDIDOS & ALERTAS DE STOCK                 */}
      {/* ========================================================================= */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Mais Vendidos no Meu Turno */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                  Mais Vendidos no Meu Turno
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Ranking por quantidade expedida ({periodLabels[periodo]})
                </p>
              </div>
              <Link
                href="/app/vendas"
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center gap-1 transition"
              >
                <span>Ir para o PDV</span>
                <ArrowRightIcon size={14} />
              </Link>
            </div>

            <div className="mt-4">
              {data.meusProdutosMaisVendidos.length === 0 ? (
                <div className="py-10 text-center text-zinc-400">
                  <p className="text-xs font-medium">Nenhuma venda registada neste período.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.meusProdutosMaisVendidos.map((prod, idx) => (
                    <div
                      key={prod.produtoId}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#1A202C] border border-black/5 dark:border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {prod.nome}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {prod.codigo} • {prod.categoriaNome}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-xs font-bold text-zinc-900 dark:text-white">
                          {Number(prod.totalFacturado).toFixed(2)} MT
                        </span>
                        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                          {prod.quantidadeVendida} {prod.quantidadeVendida === 1 ? 'unidade' : 'unidades'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alertas de Stock no Balcão */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                  Avisos de Stock no Balcão
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Artigos em nível crítico ou esgotados
                </p>
              </div>
              <Link
                href="/app/admin/produtos"
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center gap-1 transition"
              >
                <span>Catálogo</span>
                <ArrowRightIcon size={14} />
              </Link>
            </div>

            <div className="mt-4">
              {data.produtosStockBaixo.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white mb-2">
                    <CheckCircleIcon size={24} />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    Stock em Níveis Saudáveis
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Nenhum produto encontra-se abaixo do stock mínimo no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {data.produtosStockBaixo.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] dark:bg-[#1A202C] border border-black/5 dark:border-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {prod.nome}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {prod.codigo} • Mínimo: {prod.stockMinimo}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {prod.stockActual <= 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                            Esgotado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            Resta {prod.stockActual}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
