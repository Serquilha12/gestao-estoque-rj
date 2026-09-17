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

  const maxTotalVendido = data.produtosMaisVendidos.length > 0
    ? Math.max(...data.produtosMaisVendidos.map((p) => Number(p.totalFacturado)), 1)
    : 1;

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Painel Executivo</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">{periodLabels[periodo]}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Visão Geral do Negócio
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Gestão estratégica, vendas em tempo real e monitorização de stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/app/vendas"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
          >
            <PlusIcon size={16} />
            <span>Nova Venda (PDV)</span>
          </Link>
          <Link
            href="/app/admin/relatorios"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ReportsIcon size={16} />
            <span>Relatórios</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white shadow-xs">
        <form method="GET" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Período:
            </span>
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
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 lg:border-t-0 lg:pt-0">
            <input type="hidden" name="periodo" value="personalizado" />
            <span className="text-xs font-medium text-slate-500">De:</span>
            <input
              type="date"
              name="dataInicio"
              defaultValue={dataInicio}
              className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
            />
            <span className="text-xs font-medium text-slate-500">Até:</span>
            <input
              type="date"
              name="dataFim"
              defaultValue={dataFim}
              className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Aplicar
            </button>
          </div>
        </form>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Facturação */}
        <Card className="p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Facturação ({periodLabels[periodo]})</p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <SalesIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {Number(data.totalFacturadoPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Receita bruta acumulada no período
          </p>
        </Card>

        {/* Total de Vendas */}
        <Card className="p-5 border-l-4 border-l-sky-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendas Realizadas</p>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <CheckCircleIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {data.totalVendasPeriodo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Transacções concluídas com sucesso
          </p>
        </Card>

        {/* Ticket Médio */}
        <Card className="p-5 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio</p>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <ReportsIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {Number(data.ticketMedioPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Valor médio por transacção
          </p>
        </Card>

        {/* Alertas de Stock */}
        <Card className={`p-5 border-l-4 ${data.produtosStockBaixo.length > 0 ? 'border-l-amber-500 bg-amber-50/20' : 'border-l-slate-300'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Alertas de Stock</p>
            <div className={`p-2 rounded-xl ${data.produtosStockBaixo.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangleIcon size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {data.produtosStockBaixo.length}
            </p>
            {data.produtosStockBaixo.length > 0 && (
              <Badge variant="warning" className="text-[10px]">Atenção</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Produtos em nível crítico ou esgotados
          </p>
        </Card>
      </div>

      {/* Financial Intelligence & Cash Register Closing Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Capital Imobilizado */}
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Capital Imobilizado
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
              <StockIcon size={16} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-white">
            {Number(data.capitalImobilizado).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Valor financeiro actualmente guardado no armazém/stock
          </p>
        </Card>

        {/* Lucro Bruto Estimado */}
        <Card className="p-5 bg-white border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
              Lucro Bruto ({periodLabels[periodo]})
            </span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
              {data.margemLucroPeriodo}% Margem
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-700">
            {Number(data.lucroBrutoPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            CMV deduzido: {Number(data.cmvPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
        </Card>

        {/* Fecho de Caixa Hoje */}
        <Card className="p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Fecho de Caixa (Hoje)
            </span>
            <span className="text-xs font-black text-slate-900">
              {Number(data.totalFacturadoHoje).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                <CashIcon size={14} className="text-emerald-600" /> Dinheiro:
              </span>
              <span className="font-bold text-slate-900">{Number(data.fechoCaixaHoje.dinheiro).toFixed(0)} MT</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                <PhoneIcon size={14} className="text-rose-600" /> M-Pesa:
              </span>
              <span className="font-bold text-slate-900">{Number(data.fechoCaixaHoje.mpesa).toFixed(0)} MT</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                <PhoneIcon size={14} className="text-amber-600" /> e-Mola:
              </span>
              <span className="font-bold text-slate-900">{Number(data.fechoCaixaHoje.emola).toFixed(0)} MT</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                <CreditCardIcon size={14} className="text-sky-600" /> Cartão:
              </span>
              <span className="font-bold text-slate-900">{Number(data.fechoCaixaHoje.cartao).toFixed(0)} MT</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Top Selling Products & Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Produtos Mais Vendidos */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Ranking por quantidade e valor facturado ({periodLabels[periodo]})</p>
            </div>
            <Link
              href="/app/admin/relatorios"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
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
              <div className="divide-y divide-slate-100">
                {data.produtosMaisVendidos.map((prod, index) => {
                  const valFaturado = Number(prod.totalFacturado);
                  const percentagem = Math.round((valFaturado / maxTotalVendido) * 100);
                  return (
                    <div key={prod.produtoId} className="p-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-700">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{prod.nome}</p>
                            <p className="text-[11px] text-slate-500">{prod.codigo} • {prod.categoriaNome}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-700">
                            {valFaturado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {prod.quantidadeVendida} {prod.quantidadeVendida === 1 ? 'unidade' : 'unidades'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
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
              <p className="text-xs text-slate-500 mt-0.5">Itens com stock igual ou inferior ao mínimo definido</p>
            </div>
            <Link
              href="/app/admin/stock"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>Gerir stock</span>
              <ArrowRightIcon size={14} />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {data.produtosStockBaixo.length === 0 ? (
              <EmptyState
                icon={<CheckCircleIcon size={24} className="text-emerald-600" />}
                title="Stock em Níveis Saudáveis"
                description="Todos os produtos activos encontram-se com níveis de stock acima do mínimo definido."
                className="m-6"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-center">Actual</th>
                      <th className="px-4 py-3 text-center">Mínimo</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-right">Acção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.produtosStockBaixo.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{prod.nome}</p>
                          <p className="text-[10px] text-slate-400">{prod.codigo}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-rose-700">
                          {prod.stockActual}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">
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
                            className="inline-flex rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
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
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
              <ProductsIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Catálogo</p>
              <p className="text-[11px] text-slate-500">Produtos e preços</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/admin/stock"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
              <StockIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Stock</p>
              <p className="text-[11px] text-slate-500">Entrada e ajustes</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/admin/relatorios"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
              <ReportsIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Relatórios</p>
              <p className="text-[11px] text-slate-500">Análise de vendas</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/admin/users"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
              <SalesIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Utilizadores</p>
              <p className="text-[11px] text-slate-500">Gestão de acessos</p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
