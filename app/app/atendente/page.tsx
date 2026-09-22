import { requireRole } from '@/src/lib/auth';
import { getAttendantDashboard, type PeriodFilter } from '@/src/lib/reports';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  SalesIcon,
  ProductsIcon,
  CheckCircleIcon,
  PlusIcon,
  HistoryIcon,
  ArrowRightIcon,
} from '@/src/components/ui/icons';

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

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Ponto de Atendimento</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">{periodLabels[periodo]}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Painel Operacional
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Bem-vindo, <span className="font-semibold text-slate-800">{user.nome}</span>. Registo ágil de vendas e consulta de stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/app/vendas"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition active:scale-98"
          >
            <PlusIcon size={16} />
            <span>Iniciar Nova Venda (PDV)</span>
          </Link>
          <Link
            href="/app/vendas/historico"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <HistoryIcon size={16} />
            <span>Minhas Vendas</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Período:
            </span>
            {[
              { key: 'hoje', label: 'Hoje' },
              { key: '7d', label: '7 Dias' },
              { key: 'mes', label: 'Este Mês' },
              { key: 'todos', label: 'Tudo' },
            ].map((p) => {
              const active = periodo === p.key;
              return (
                <Link
                  key={p.key}
                  href={`/app/atendente?periodo=${p.key}`}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/app/admin/produtos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            <ProductsIcon size={14} />
            <span>Consultar Catálogo de Produtos</span>
          </Link>
        </div>
      </Card>

      {/* Operational KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Minha Facturação */}
        <Card className="p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Minha Facturação ({periodLabels[periodo]})</p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <SalesIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {Number(data.meuTotalFacturadoPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Total arrecadado nas suas vendas
          </p>
        </Card>

        {/* Minhas Vendas Realizadas */}
        <Card className="p-5 border-l-4 border-l-sky-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendas Registadas</p>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <CheckCircleIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {data.minhasVendasPeriodo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Atendimentos fechados com sucesso
          </p>
        </Card>

        {/* Meu Ticket Médio */}
        <Card className="p-5 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Meu Ticket Médio</p>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <HistoryIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {(data.minhasVendasPeriodo > 0 ? Number(data.meuTotalFacturadoPeriodo) / data.minhasVendasPeriodo : 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Média por venda no período
          </p>
        </Card>
      </div>

      {/* Operational Stock Awareness */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Avisos de Stock no Balcão</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Produtos com stock baixo ou esgotado para atenção durante o atendimento
            </p>
          </div>
          <Link
            href="/app/admin/produtos"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Ver catálogo</span>
            <ArrowRightIcon size={14} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.produtosStockBaixo.length === 0 ? (
            <EmptyState
              icon={<CheckCircleIcon size={24} className="text-emerald-600" />}
              title="Stock Suficiente"
              description="Nenhum produto encontra-se em estado crítico de stock neste momento."
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-center">Stock Disponível</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.produtosStockBaixo.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{prod.codigo}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{prod.nome}</td>
                      <td className="px-4 py-3 text-center font-extrabold text-rose-700">
                        {prod.stockActual}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {prod.stockActual <= 0 ? (
                          <Badge variant="danger">Esgotado</Badge>
                        ) : (
                          <Badge variant="warning">Stock Baixo ({prod.stockActual} restantes)</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
