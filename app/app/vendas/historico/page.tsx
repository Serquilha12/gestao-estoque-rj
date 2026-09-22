import { getCurrentUser, requireRole } from '@/src/lib/auth';
import { getSales } from '@/src/lib/sales';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import { SalesIcon, PlusIcon, EyeIcon } from '@/src/components/ui/icons';

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
            Registo completo de transações e comprovativos emitidos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/vendas"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
          >
            <PlusIcon size={16} />
            <span>Nova Venda</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="p-4 border-l-4 border-l-emerald-600 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Facturado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {totalArrecadado.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de Transacções</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{vendas.length}</p>
        </Card>
      </div>

      {/* Sales Table Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <CardTitle>Transacções Registadas</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Ordenado por data decrescente</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vendas.length === 0 ? (
            <EmptyState
              icon={<SalesIcon size={24} />}
              title="Nenhuma venda registada"
              description="Ainda não existem vendas associadas a este utilizador no sistema."
              action={
                <Link
                  href="/app/vendas"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <PlusIcon size={14} />
                  <span>Realizar Primeira Venda</span>
                </Link>
              }
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">N.º Venda</th>
                    <th className="px-4 py-3">Data / Hora</th>
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
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(venda.criadoEm).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
