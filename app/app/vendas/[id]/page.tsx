import { notFound } from 'next/navigation';
import { getCurrentUser, requireRole } from '@/src/lib/auth';
import { getSaleById } from '@/src/lib/sales';
import Link from 'next/link';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon } from '@/src/components/ui/icons';

export default async function VendaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['ADMINISTRADOR', 'ATENDENTE'], '/login');
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const { id } = await params;
  const venda = await getSaleById(Number(id), currentUser.id, user.perfil);
  if (!venda) notFound();

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Top Bar with Back Link */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/app/vendas/historico"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeftIcon size={16} />
          <span>Voltar ao Histórico</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/vendas"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
          >
            <PlusIcon size={14} />
            <span>Nova Venda</span>
          </Link>
        </div>
      </div>

      {/* Sale Voucher Card */}
      <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
        {/* Header of Voucher */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircleIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Comprovativo de Venda #{venda.id}
                </h1>
                <Badge variant="success">Concluída</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Emitido em {new Date(venda.criadoEm).toLocaleString('pt-PT')}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total da Transacção</p>
            <p className="text-2xl font-black text-emerald-700">
              {Number(venda.total).toFixed(2)} MT
            </p>
          </div>
        </div>

        {/* Transaction Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-white border-b border-slate-100 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider">Identificador</span>
            <p className="mt-1 font-extrabold text-slate-900 text-sm">#{venda.id}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider">Atendente Responsável</span>
            <p className="mt-1 font-semibold text-slate-900 text-sm">{venda.utilizadorNome}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider">Data / Hora do Registo</span>
            <p className="mt-1 font-medium text-slate-700">
              {new Date(venda.criadoEm).toLocaleString('pt-PT')}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Artigos da Transacção</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Qtd.</th>
                  <th className="px-4 py-3 text-right">Preço Unitário</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venda.itens.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.produto?.nome ?? `Produto #${item.produtoId}`}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {item.quantidade}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {Number(item.precoUnitario).toFixed(2)} MT
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                      {Number(item.subtotal).toFixed(2)} MT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total Row */}
          <div className="mt-6 flex flex-col items-end gap-1 border-t border-slate-200 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Valor Total Facturado</span>
            <span className="text-3xl font-black text-emerald-700">
              {Number(venda.total).toFixed(2)} MT
            </span>
          </div>
        </div>
      </Card>
    </main>
  );
}
