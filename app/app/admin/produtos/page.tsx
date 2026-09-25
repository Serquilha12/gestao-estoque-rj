import { getCategories, getProducts } from '@/src/lib/catalog';
import { requireRole } from '@/src/lib/auth';
import { ConfirmStatusButton } from '@/app/app/admin/components/confirm-status-button';
import Link from 'next/link';
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
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {produtos.length} {produtos.length === 1 ? 'produto listado' : 'produtos listados'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {isAdmin ? 'Gestão de Produtos' : 'Consulta de Produtos'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isAdmin
              ? 'Registo de artigos, definição de preços de venda e parametrização de stocks mínimos.'
              : 'Consulte preços de venda e disponibilidade física de stock.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              href="/app/admin/produtos/novo"
              className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-4.5 py-2 text-xs font-bold text-white dark:text-black shadow-xs hover:opacity-90 active:scale-98 transition cursor-pointer"
            >
              <PlusIcon size={14} />
              <span>Novo Produto</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-4 shadow-xs">
        <form method="GET" className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_200px_160px_auto] items-center">
          <div className="relative">
            <input
              name="search"
              defaultValue={search}
              placeholder="Pesquisar por código ou nome..."
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
            />
          </div>

          <select
            name="categoriaId"
            defaultValue={categoriaId === null ? '' : String(categoriaId)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition cursor-pointer"
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
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition cursor-pointer"
          >
            <option value="todos">Todos os estados</option>
            <option value="activo">Apenas Activos</option>
            <option value="inactivo">Apenas Inactivos</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-black dark:bg-white px-4.5 py-2 text-xs font-bold text-white dark:text-black hover:opacity-90 active:scale-95 transition cursor-pointer shadow-2xs"
          >
            <FilterIcon size={13} />
            <span>Filtrar</span>
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] shadow-xs overflow-hidden">
        {produtos.length === 0 ? (
          <EmptyState
            icon={<ProductsIcon size={24} />}
            title="Nenhum produto encontrado"
            description="Não foram encontrados produtos com os filtros selecionados."
            action={
              isAdmin ? (
                <Link
                  href="/app/admin/produtos/novo"
                  className="inline-flex items-center gap-1.5 rounded-full bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:opacity-90"
                >
                  <PlusIcon size={14} />
                  <span>Adicionar Primeiro Produto</span>
                </Link>
              ) : null
            }
            className="m-8"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-[11px] uppercase font-bold text-zinc-500 dark:text-zinc-400 border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3.5">Código</th>
                  <th className="px-4 py-3.5">Produto</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  {isAdmin && <th className="px-4 py-3.5 text-right">Compra</th>}
                  <th className="px-4 py-3.5 text-right">Venda</th>
                  {isAdmin && <th className="px-4 py-3.5 text-right">Margem</th>}
                  <th className="px-4 py-3.5 text-center">Stock Actual</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  {isAdmin && <th className="px-4 py-3.5 text-center">Acções</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-zinc-900 dark:text-white">
                {produtos.map((produto) => {
                  const stockBaixo = produto.stockActual <= produto.stockMinimo;
                  const pVenda = Number(produto.precoVenda);
                  const pCompra = Number(produto.precoCompra);
                  const margemPct = pVenda > 0 ? (((pVenda - pCompra) / pVenda) * 100).toFixed(1) : '0.0';
                  return (
                    <tr
                      key={produto.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                        stockBaixo ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-900 dark:text-white">
                        {produto.codigo}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white">
                        {produto.nome}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                        {produto.categoriaNome || '—'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right text-zinc-500 dark:text-zinc-400">
                          {pCompra.toFixed(2)} MT
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-right font-bold text-zinc-900 dark:text-white">
                        {pVenda.toFixed(2)} MT
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              Number(margemPct) >= 30
                                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                                : Number(margemPct) > 0
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {margemPct}%
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-center">
                        {produto.stockActual <= 0 ? (
                          <Badge variant="danger">Esgotado (0)</Badge>
                        ) : stockBaixo ? (
                          <Badge variant="warning">{produto.stockActual} (Mín: {produto.stockMinimo})</Badge>
                        ) : (
                          <span className="font-bold text-zinc-900 dark:text-white">{produto.stockActual}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={produto.activo ? 'success' : 'neutral'}>
                          {produto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/app/admin/produtos/${produto.id}/editar`}
                              className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
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
      </div>
    </main>
  );
}
