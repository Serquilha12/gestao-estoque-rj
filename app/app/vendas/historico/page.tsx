import { getCurrentUser, requireRole } from '@/src/lib/auth';
import { getSales } from '@/src/lib/sales';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import { SalesIcon, PlusIcon, EyeIcon } from '@/src/components/ui/icons';
import { formatDateTimeMaputo } from '@/src/lib/date';

export default async function HistoricoVendasPage() {
  const user = await requireRole(['ADMINISTRADOR', 'ATENDENTE'], '/login');
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const vendas = await getSales(currentUser.id, user.perfil);
  const isAdmin = user.perfil === 'ADMINISTRADOR';

  const totalArrecadado = vendas.reduce((sum, v) => sum + Number(v.total), 0);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Histórico de Operações</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {isAdmin ? 'Todas as Vendas do Sistema' : 'Minhas Vendas Realizadas'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Histórico de Vendas
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Registo de transacções com sincronização de horário para Moçambique (Africa/Maputo UTC+2).
          </p>
        </div>

        <Link
          href="/app/vendas"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
        >
          <PlusIcon size={14} />
          <span>Nova Venda no PDV</span>
        </Link>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5 border-l-4 border-l-emerald-600 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Arrecadado
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {totalArrecadado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {vendas.length} {vendas.length === 1 ? 'venda efectuada' : 'vendas efectuadas'}
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-600 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ticket Médio
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {vendas.length > 0
              ? (totalArrecadado / vendas.length).toLocaleString('pt-PT', { minimumFractionDigits: 2 })
              : '0.00'}{' '}
            MT
          </p>
          <p className="mt-1 text-xs text-slate-500">Média por transacção</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-600 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Última Venda Registada
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {vendas.length > 0
              ? formatDateTimeMaputo(vendas[0]!.criadoEm, false)
              : 'Sem vendas'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Horário Oficial de Maputo</p>
        </Card>
      </div>

      {/* Sales List Table */}
      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <CardTitle>Listagem de Transacções Concluídas</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em &quot;Ver Detalhes&quot; para aceder ao comprovativo completo e reimprimir o talão.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {vendas.length === 0 ? (
            <EmptyState
              icon={<SalesIcon size={24} />}
              title="Nenhuma venda encontrada"
              description="Ainda não existem vendas concluídas registadas."
              action={
                <Link
                  href="/app/vendas"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  Abrir Caixa / PDV
                </Link>
              }
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">N.º Venda</th>
                    <th className="px-4 py-3">Data / Hora (Maputo)</th>
                    <th className="px-4 py-3">Atendente</th>
                    <th className="px-4 py-3 text-right">Valor Total</th>
                    <th className="px-4 py-3 text-center">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        #{venda.id}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {formatDateTimeMaputo(venda.criadoEm)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{venda.utilizadorNome}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">
                        {Number(venda.total).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/app/vendas/${venda.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                        >
                          <EyeIcon size={14} />
                          <span>Ver Detalhes</span>
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
    </main>
  );
}
