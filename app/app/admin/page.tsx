import { requireRole } from '@/src/lib/auth';
import { getAdminDashboard, type PeriodFilter } from '@/src/lib/reports';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  SalesIcon,
  StockIcon,
  ReportsIcon,
  ProductsIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowRightIcon,
  CashIcon,
  PhoneIcon,
  CreditCardIcon,
} from '@/src/components/ui/icons';

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
  }>;
}) {
  await requireRole('ADMINISTRADOR', '/login');
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

  const data = await getAdminDashboard({
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

  const maxTotalVendido =
    data.produtosMaisVendidos.length > 0
      ? Math.max(...data.produtosMaisVendidos.map((p) => Number(p.totalFacturado)), 1)
      : 1;

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Painel Executivo</Badge>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {periodLabels[periodo]}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Visão Geral do Negócio
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Gestão estratégica, vendas em tempo real e monitorização de stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/admin/relatorios"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#121824] px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition shadow-2xs"
          >
            <ReportsIcon size={14} />
            <span>Relatórios</span>
          </Link>
          <Link
            href="/app/admin/stock"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#121824] px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition shadow-2xs"
          >
            <StockIcon size={14} />
            <span>Gestão Stock</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-3 shadow-xs">
        <form method="GET" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Período:
            </span>
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/60 p-1">
              {[
                { key: 'hoje', label: 'Hoje' },
                { key: '7d', label: '7 Dias' },
                { key: '30d', label: '30 Dias' },
                { key: 'mes', label: 'Este Mês' },
                { key: 'todos', label: 'Todo o Histórico' },
              ].map((p) => {
                const active = periodo === p.key;
                return (
                  <Link
                    key={p.key}
                    href={`/app/admin?periodo=${p.key}`}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all duration-150 ${
                      active
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5 lg:border-t-0 lg:pt-0">
            <input type="hidden" name="periodo" value="personalizado" />
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/60 border border-black/10 dark:border-white/10 px-3 py-1">
              <span className="text-[11px] font-semibold text-zinc-400">De:</span>
              <input
                type="date"
                name="dataInicio"
                defaultValue={dataInicio}
                className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/60 border border-black/10 dark:border-white/10 px-3 py-1">
              <span className="text-[11px] font-semibold text-zinc-400">Até:</span>
              <input
                type="date"
                name="dataFim"
                defaultValue={dataFim}
                className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-black dark:bg-white px-4 py-1.5 text-xs font-bold text-white dark:text-black hover:opacity-90 active:scale-95 transition cursor-pointer shadow-2xs"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Bento Grid: Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Facturação */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-5 shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Facturação ({periodLabels[periodo]})
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <SalesIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            {Number(data.totalFacturadoPeriodo).toLocaleString('pt-PT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">MT</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Receita bruta acumulada no período
          </p>
        </div>

        {/* Total de Vendas */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-5 shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Vendas Concluídas
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <CheckCircleIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            {data.totalVendasPeriodo}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Transacções finalizadas com sucesso
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-5 shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Ticket Médio
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <ReportsIcon size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            {Number(data.ticketMedioPeriodo).toLocaleString('pt-PT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">MT</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Média facturada por pedido
          </p>
        </div>

        {/* Alertas de Stock */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-5 shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Alertas de Stock
            </p>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                data.produtosStockBaixo.length > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              }`}
            >
              <AlertTriangleIcon size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              {data.produtosStockBaixo.length}
            </p>
            {data.produtosStockBaixo.length > 0 && (
              <Badge variant="warning" className="text-[10px]">
                Atenção
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Artigos em nível crítico ou esgotados
          </p>
        </div>
      </div>

      {/* Financial Intelligence & Cash Register Closing Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Capital Imobilizado */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Capital Imobilizado
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <StockIcon size={16} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">
            {Number(data.capitalImobilizado).toLocaleString('pt-PT', {
              minimumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-semibold text-zinc-500">MT</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Valor em custo actualmente no armazém/stock
          </p>
        </div>

        {/* Lucro Bruto Estimado */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-5 shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Lucro Bruto ({periodLabels[periodo]})
            </span>
            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-xs font-bold text-neutral-900 dark:text-white">
              {data.margemLucroPeriodo}% Margem
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-neutral-900 dark:text-white">
            {Number(data.lucroBrutoPeriodo).toLocaleString('pt-PT', {
              minimumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">MT</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            CMV deduzido:{' '}
            {Number(data.cmvPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
        </div>

        {/* Fecho de Caixa Hoje */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-5 shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Fecho de Caixa (Hoje)
            </span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {Number(data.totalFacturadoHoje).toLocaleString('pt-PT', {
                minimumFractionDigits: 2,
              })}{' '}
              MT
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/80 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-semibold text-[11px]">
                <CashIcon size={14} className="text-neutral-900 dark:text-white" /> Dinheiro:
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {Number(data.fechoCaixaHoje.dinheiro).toFixed(0)} MT
              </span>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/80 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-semibold text-[11px]">
                <PhoneIcon size={14} className="text-neutral-900 dark:text-white" /> M-Pesa:
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {Number(data.fechoCaixaHoje.mpesa).toFixed(0)} MT
              </span>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/80 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-semibold text-[11px]">
                <PhoneIcon size={14} className="text-neutral-900 dark:text-white" /> e-Mola:
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {Number(data.fechoCaixaHoje.emola).toFixed(0)} MT
              </span>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/80 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-semibold text-[11px]">
                <CreditCardIcon size={14} className="text-neutral-900 dark:text-white" /> Cartão:
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {Number(data.fechoCaixaHoje.cartao).toFixed(0)} MT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Top Selling Products & Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Produtos Mais Vendidos */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Ranking por quantidade e valor facturado ({periodLabels[periodo]})
              </p>
            </div>
            <Link
              href="/app/admin/relatorios"
              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:opacity-80 transition"
            >
              <span>Ver todos</span>
              <ArrowRightIcon size={14} />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {data.produtosMaisVendidos.length === 0 ? (
              <EmptyState
                title="Sem vendas registadas"
                description={`Não existem dados de vendas registados para o período selecionado (${periodLabels[periodo]}).`}
                className="m-6"
              />
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {data.produtosMaisVendidos.map((prod, index) => {
                  const valFaturado = Number(prod.totalFacturado);
                  const percentagem = Math.round((valFaturado / maxTotalVendido) * 100);
                  return (
                    <div
                      key={prod.produtoId}
                      className="p-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-neutral-900 dark:text-white">
                              {prod.nome}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {prod.codigo} • {prod.categoriaNome}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">
                            {valFaturado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}{' '}
                            MT
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {prod.quantidadeVendida}{' '}
                            {prod.quantidadeVendida === 1 ? 'unidade' : 'unidades'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-300"
                          style={{ width: `${percentagem}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas de Stock Baixo */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos em Alerta de Stock</CardTitle>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Itens com stock igual ou inferior ao mínimo definido
              </p>
            </div>
            <Link
              href="/app/admin/stock"
              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:opacity-80 transition"
            >
              <span>Gerir stock</span>
              <ArrowRightIcon size={14} />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {data.produtosStockBaixo.length === 0 ? (
              <EmptyState
                icon={<CheckCircleIcon size={24} className="text-neutral-900 dark:text-white" />}
                title="Stock em Níveis Saudáveis"
                description="Todos os produtos activos encontram-se com níveis de stock acima do mínimo definido."
                className="m-6"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-[11px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-center">Actual</th>
                      <th className="px-4 py-3 text-center">Mínimo</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-right">Acção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.produtosStockBaixo.map((prod) => (
                      <tr
                        key={prod.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-neutral-900 dark:text-white">{prod.nome}</p>
                          <p className="text-[10px] text-neutral-400">{prod.codigo}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-rose-600 dark:text-rose-400">
                          {prod.stockActual}
                        </td>
                        <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">
                          {prod.stockMinimo}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {prod.stockActual <= 0 ? (
                            <Badge variant="danger">Esgotado</Badge>
                          ) : (
                            <Badge variant="warning">Stock Baixo</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/app/admin/stock?produtoId=${prod.id}`}
                            className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                          >
                            Repor
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Module Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Link
          href="/app/admin/produtos"
          className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-4 shadow-xs hover:border-neutral-900 dark:hover:border-neutral-500 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition">
              <ProductsIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">Catálogo</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Produtos e preços</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/admin/stock"
          className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-4 shadow-xs hover:border-neutral-900 dark:hover:border-neutral-500 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition">
              <StockIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">Stock</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Entrada e ajustes</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/admin/relatorios"
          className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-4 shadow-xs hover:border-neutral-900 dark:hover:border-neutral-500 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition">
              <ReportsIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">Relatórios</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Análise de vendas</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/admin/users"
          className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121824] p-4 shadow-xs hover:border-neutral-900 dark:hover:border-neutral-500 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition">
              <SalesIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">Utilizadores</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Gestão de acessos</p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
