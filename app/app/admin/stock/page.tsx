import { requireRole } from '@/src/lib/auth';
import { getProducts } from '@/src/lib/catalog';
import { getStockMovements } from '@/src/lib/stock';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  StockIcon,
  ProductsIcon,
  AlertTriangleIcon,
  PlusIcon,
  MinusIcon,
  EditIcon,
  FilterIcon,
} from '@/src/components/ui/icons';
import { formatDateTimeMaputo } from '@/src/lib/date';

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams?: Promise<{
    produtoId?: string;
    tipo?: string;
    dataInicio?: string;
    dataFim?: string;
    aba?: string;
  }>;
}) {
  await requireRole('ADMINISTRADOR', '/login');
  const params = searchParams ? await searchParams : {};
  const produtoId = params.produtoId ? Number(params.produtoId) : null;
  const tipo = params.tipo === 'ENTRADA' || params.tipo === 'SAIDA' || params.tipo === 'AJUSTE' ? params.tipo : null;
  const dataInicio = params.dataInicio ?? null;
  const dataFim = params.dataFim ?? null;

  const [produtos, movimentos] = await Promise.all([
    getProducts(),
    getStockMovements({ produtoId, tipo, dataInicio, dataFim }),
  ]);

  const produtosActivos = produtos.filter((p) => p.activo);
  const produtosStockBaixo = produtosActivos.filter((p) => p.stockActual <= p.stockMinimo);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Gestão de Inventário</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Auditoria e Movimentação</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Controlo e Auditoria de Stock
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Registo transaccional de entradas, saídas manuais e ajustes físicos de inventário.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/admin/produtos"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ProductsIcon size={16} />
            <span>Gerir Catálogo</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Produtos Activos</p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ProductsIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {produtosActivos.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Catálogo operacional disponível</p>
        </Card>

        <Card className={`p-5 border-l-4 ${produtosStockBaixo.length > 0 ? 'border-l-amber-500 bg-amber-50/20' : 'border-l-slate-300'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Alertas de Stock</p>
            <div className={`p-2 rounded-xl ${produtosStockBaixo.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangleIcon size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {produtosStockBaixo.length}
            </p>
            {produtosStockBaixo.length > 0 && <Badge variant="warning" className="text-[10px]">Atenção</Badge>}
          </div>
          <p className="mt-1 text-xs text-slate-500">Produtos em ou abaixo do stock mínimo</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Movimentos Auditados</p>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <StockIcon size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {movimentos.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Histórico completo de transações de stock</p>
        </Card>
      </div>

      {/* Stock Operation Forms Grid (3 Columns) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Entrada de Stock */}
        <Card className="border-emerald-200/80 bg-emerald-50/10">
          <CardHeader className="bg-emerald-50/40 border-b border-emerald-100/80">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
                <PlusIcon size={16} />
              </div>
              <div>
                <CardTitle className="text-base text-emerald-950">Entrada de Stock</CardTitle>
                <p className="text-[11px] text-emerald-700 mt-0.5">Incrementa o stock físico disponível</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form action="/api/admin/stock/entrada" method="POST" className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produto *</label>
                <select
                  name="produtoId"
                  defaultValue={produtoId ? String(produtoId) : ''}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                >
                  <option value="">Seleccione o produto...</option>
                  {produtosActivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nome} (Stock: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade a Adicionar *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="quantidade"
                  required
                  placeholder="Ex: 10"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  name="motivo"
                  placeholder="Ex: Compra de Fornecedor"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
              >
                Registar Entrada
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Saída Manual de Stock */}
        <Card className="border-rose-200/80 bg-rose-50/10">
          <CardHeader className="bg-rose-50/40 border-b border-rose-100/80">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                <MinusIcon size={16} />
              </div>
              <div>
                <CardTitle className="text-base text-rose-950">Saída Manual</CardTitle>
                <p className="text-[11px] text-rose-700 mt-0.5">Decrementa stock por quebra, perda ou descarte</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form action="/api/admin/stock/saida" method="POST" className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produto *</label>
                <select
                  name="produtoId"
                  defaultValue={produtoId ? String(produtoId) : ''}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-rose-600"
                >
                  <option value="">Seleccione o produto...</option>
                  {produtosActivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nome} (Stock: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade a Retirar *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="quantidade"
                  required
                  placeholder="Ex: 2"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-rose-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  name="motivo"
                  placeholder="Ex: Produto danificado ou caducado"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-rose-600"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
              >
                Registar Saída
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Ajuste Físico de Stock */}
        <Card className="border-amber-200/80 bg-amber-50/10">
          <CardHeader className="bg-amber-50/40 border-b border-amber-100/80">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
                <EditIcon size={16} />
              </div>
              <div>
                <CardTitle className="text-base text-amber-950">Ajuste Físico</CardTitle>
                <p className="text-[11px] text-amber-800 mt-0.5">Corrige o valor com base em contagem de inventário</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form action="/api/admin/stock/ajuste" method="POST" className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produto *</label>
                <select
                  name="produtoId"
                  defaultValue={produtoId ? String(produtoId) : ''}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-amber-600"
                >
                  <option value="">Seleccione o produto...</option>
                  {produtosActivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nome} (Actual: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Novo Stock Contado *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="novoStock"
                  required
                  placeholder="Ex: 15"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Ajuste * (Obrigatório)</label>
                <input
                  type="text"
                  name="motivo"
                  required
                  placeholder="Ex: Inventário de Fecho Mensal"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-amber-600"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
              >
                Registar Ajuste
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Movement Audit History Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Histórico de Auditoria de Movimentos</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Rastreamento detalhado com utilizador e timestamps</p>
          </div>

          {/* Filter Bar */}
          <form method="GET" className="flex flex-wrap items-center gap-2">
            <select
              name="produtoId"
              defaultValue={produtoId ? String(produtoId) : ''}
              className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-600"
            >
              <option value="">Todos os produtos</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} - {p.nome}
                </option>
              ))}
            </select>

            <select
              name="tipo"
              defaultValue={tipo ?? ''}
              className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-600"
            >
              <option value="">Todos os tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="AJUSTE">Ajuste</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <FilterIcon size={13} />
              <span>Filtrar</span>
            </button>
          </form>
        </CardHeader>

        <CardContent className="p-0">
          {movimentos.length === 0 ? (
            <EmptyState
              icon={<StockIcon size={24} />}
              title="Nenhum movimento encontrado"
              description="Não existem registos de movimentação de stock correspondentes aos filtros aplicados."
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Data / Hora</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-center">Qtd.</th>
                    <th className="px-4 py-3 text-center">Anterior</th>
                    <th className="px-4 py-3 text-center">Posterior</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimentos.map((mov) => {
                    const badgeVariant =
                      mov.tipo === 'ENTRADA'
                        ? 'success'
                        : mov.tipo === 'SAIDA'
                        ? 'danger'
                        : 'warning';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {formatDateTimeMaputo(mov.criadoEm)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{mov.produtoNome}</p>
                          <p className="text-[10px] text-slate-400">{mov.produtoCodigo}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={badgeVariant}>{mov.tipo}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold text-slate-900">
                          {mov.tipo === 'ENTRADA' ? `+${mov.quantidade}` : mov.tipo === 'SAIDA' ? `-${mov.quantidade}` : mov.quantidade}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{mov.stockAnterior}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{mov.stockPosterior}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{mov.utilizadorNome}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{mov.motivo ?? '—'}</td>
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
