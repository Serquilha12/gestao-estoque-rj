import { getCategories, getProducts } from '@/src/lib/catalog';
import { requireRole } from '@/src/lib/auth';
import { ConfirmStatusButton } from '@/app/app/admin/components/confirm-status-button';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  ProductsIcon,
  PlusIcon,
  EditIcon,
  FilterIcon,
} from '@/src/components/ui/icons';

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; categoriaId?: string; estado?: string }>;
}) {
  const user = await requireRole(['ADMINISTRADOR', 'ATENDENTE'], '/login');
  const params = searchParams ? await searchParams : {};
  const search = typeof params.search === 'string' ? params.search : '';
  const categoriaId = typeof params.categoriaId === 'string' && params.categoriaId ? Number(params.categoriaId) : null;
  const estado = typeof params.estado === 'string' ? params.estado : 'todos';
  const activo = estado === 'todos' ? null : estado === 'activo';
  const [produtos, categorias] = await Promise.all([
    getProducts({ search, categoriaId, activo }),
    getCategories(),
  ]);

  const isAdmin = user.perfil === 'ADMINISTRADOR';

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Catálogo de Produtos</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {produtos.length} {produtos.length === 1 ? 'produto listado' : 'produtos listados'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isAdmin ? 'Gestão de Produtos' : 'Consulta de Produtos'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            {isAdmin
              ? 'Registo de artigos, definição de preços de venda e parametrização de stocks mínimos.'
              : 'Consulte preços de venda e disponibilidade física de stock.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              href="/app/admin/produtos/novo"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
            >
              <PlusIcon size={16} />
              <span>Novo Produto</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white shadow-xs">
        <form method="GET" className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_200px_160px_auto] items-center">
          <div className="relative">
            <input
              name="search"
              defaultValue={search}
              placeholder="Pesquisar por código ou nome..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          <select
            name="categoriaId"
            defaultValue={categoriaId === null ? '' : String(categoriaId)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>

          <select
            name="estado"
            defaultValue={estado}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition"
          >
            <option value="todos">Todos os estados</option>
            <option value="activo">Apenas Activos</option>
            <option value="inactivo">Apenas Inactivos</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <FilterIcon size={14} />
            <span>Filtrar</span>
          </button>
        </form>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {produtos.length === 0 ? (
            <EmptyState
              icon={<ProductsIcon size={24} />}
              title="Nenhum produto encontrado"
              description="Não foram encontrados produtos com os filtros selecionados."
              action={
                isAdmin ? (
                  <Link
                    href="/app/admin/produtos/novo"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    <PlusIcon size={14} />
                    <span>Adicionar Primeiro Produto</span>
                  </Link>
                ) : null
              }
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Categoria</th>
                    {isAdmin && <th className="px-4 py-3 text-right">Compra</th>}
                    <th className="px-4 py-3 text-right">Venda</th>
                    <th className="px-4 py-3 text-center">Stock Actual</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    {isAdmin && <th className="px-4 py-3 text-center">Acções</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produtos.map((produto) => {
                    const stockBaixo = produto.stockActual <= produto.stockMinimo;
                    return (
                      <tr
                        key={produto.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          stockBaixo ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-extrabold text-slate-900">
                          {produto.codigo}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{produto.nome}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-600">
                            {produto.categoriaNome || '—'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right text-slate-500 font-medium">
                            {Number(produto.precoCompra).toFixed(2)} MT
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-black text-emerald-700">
                          {Number(produto.precoVenda).toFixed(2)} MT
                        </td>
                        <td className="px-4 py-3 text-center">
                          {produto.stockActual <= 0 ? (
                            <Badge variant="danger">Esgotado (0)</Badge>
                          ) : stockBaixo ? (
                            <Badge variant="warning">{produto.stockActual} (Mín: {produto.stockMinimo})</Badge>
                          ) : (
                            <span className="font-bold text-slate-800">{produto.stockActual}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={produto.activo ? 'success' : 'neutral'}>
                            {produto.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                href={`/app/admin/produtos/${produto.id}/editar`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                              >
                                <EditIcon size={12} />
                                <span>Editar</span>
                              </Link>
                              <form action={`/api/admin/produtos/${produto.id}/status`} method="POST">
                                <input type="hidden" name="activo" value={String(!produto.activo)} />
                                <ConfirmStatusButton activo={produto.activo} entidade="produto" />
                              </form>
                            </div>
                          </td>
                        )}
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
