import { requireRole } from '@/src/lib/auth';
import { getAdminDashboard, type PeriodFilter } from '@/src/lib/reports';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  ReportsIcon,
  ArrowLeftIcon,
} from '@/src/components/ui/icons';

export default async function AdminRelatoriosPage({
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

  const totalFacturadoGeral = Number(data.totalFacturadoPeriodo);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/admin"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeftIcon size={14} />
              <span>Dashboard</span>
            </Link>
            <span className="text-xs text-slate-400">•</span>
            <Badge variant="neutral">Relatórios & Desempenho</Badge>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Relatório de Vendas e Desempenho
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Análise detalhada de volume de saída por produto, arrecadação bruta e participação percentual.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white shadow-xs">
        <form method="GET" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Intervalo:
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
                  href={`/app/admin/relatorios?periodo=${p.key}`}
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

      {/* Summary KPI Strip */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Facturação ({periodLabels[periodo]})
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {Number(data.totalFacturadoPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">Total bruto arrecadado</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            CMV (Custo Mercadoria)
          </p>
          <p className="mt-2 text-2xl font-black text-amber-700">
            {Number(data.cmvPeriodo ?? 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">Custo base dos produtos vendidos</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lucro Bruto (Margem)
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-800">
            {Number(data.lucroBrutoPeriodo ?? 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs font-bold text-emerald-700">
            Margem Líquida: {Number(data.margemLucroPeriodo ?? 0).toFixed(1)}%
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Vendas Concluídas
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {data.totalVendasPeriodo}
          </p>
          <p className="mt-1 text-xs text-slate-500">Transacções com recibo</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-indigo-600">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ticket Médio
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {Number(data.ticketMedioPeriodo).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">Gasto médio por cliente</p>
        </Card>
      </div>

      {/* Detailed Product Sales Performance Table */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <CardTitle>Desempenho por Produto Vendido</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranking detalhado ordenado por volume financeiro total ({periodLabels[periodo]})
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {data.produtosMaisVendidos.length === 0 ? (
            <EmptyState
              icon={<ReportsIcon size={24} />}
              title="Sem registos de vendas no período"
              description={`Nenhum produto foi vendido durante o intervalo selecionado (${periodLabels[periodo]}).`}
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Posição</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 text-center">Qtd. Vendida</th>
                    <th className="px-4 py-3 text-right">Facturação Total</th>
                    <th className="px-4 py-3 text-right">Participação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.produtosMaisVendidos.map((prod, index) => {
                    const valFaturado = Number(prod.totalFacturado);
                    const participacao = totalFacturadoGeral > 0
                      ? ((valFaturado / totalFacturadoGeral) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <tr key={prod.produtoId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-extrabold text-slate-900">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {prod.codigo}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {prod.nome}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {prod.categoriaNome}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {prod.quantidadeVendida}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">
                          {valFaturado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-600">
                          {participacao}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
