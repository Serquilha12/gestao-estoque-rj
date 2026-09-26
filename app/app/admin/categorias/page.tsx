import { getCategories } from '@/src/lib/catalog';
import { requireRole } from '@/src/lib/auth';
import { ConfirmStatusButton } from '@/app/app/admin/components/confirm-status-button';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/states';
import {
  CategoriesIcon,
  PlusIcon,
  EditIcon,
  FilterIcon,
} from '@/src/components/ui/icons';
import { formatDateMaputo } from '@/src/lib/date';

export default async function AdminCategoriasPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; estado?: string }>;
}) {
  const user = await requireRole(['ADMINISTRADOR', 'ATENDENTE'], '/login');
  const params = searchParams ? await searchParams : {};
  const search = typeof params.search === 'string' ? params.search : '';
  const estadoParam = typeof params.estado === 'string' ? params.estado : 'todos';
  const activo = estadoParam === 'todos' ? null : estadoParam === 'activo';
  const categorias = await getCategories({ search, activo });

  const isAdmin = user.perfil === 'ADMINISTRADOR';

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Catálogo de Categorias</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {categorias.length} {categorias.length === 1 ? 'categoria listada' : 'categorias listadas'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isAdmin ? 'Gestão de Categorias' : 'Categorias de Produtos'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Organização taxonómica dos artigos e agrupamento para o ponto de venda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              href="/app/admin/categorias/novo"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
            >
              <PlusIcon size={16} />
              <span>Nova Categoria</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white shadow-xs">
        <form method="GET" className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_180px_auto] items-center">
          <input
            name="search"
            defaultValue={search}
            placeholder="Pesquisar categoria por nome..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition"
          />

          <select
            name="estado"
            defaultValue={estadoParam}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition"
          >
            <option value="todos">Todos os estados</option>
            <option value="activo">Apenas Activas</option>
            <option value="inactivo">Apenas Inactivas</option>
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

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          {categorias.length === 0 ? (
            <EmptyState
              icon={<CategoriesIcon size={24} />}
              title="Nenhuma categoria encontrada"
              description="Não foram encontradas categorias correspondentes aos filtros aplicados."
              action={
                isAdmin ? (
                  <Link
                    href="/app/admin/categorias/novo"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    <PlusIcon size={14} />
                    <span>Adicionar Primeira Categoria</span>
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
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3 text-center">Produtos Associados</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3">Data de Criação</th>
                    {isAdmin && <th className="px-4 py-3 text-center">Acções</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categorias.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {item.nome}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {item.descricao ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {item.produtosCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={item.activo ? 'success' : 'neutral'}>
                          {item.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateMaputo(item.criadoEm)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/app/admin/categorias/${item.id}/editar`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                            >
                              <EditIcon size={12} />
                              <span>Editar</span>
                            </Link>
                            <form action={`/api/admin/categorias/${item.id}/status`} method="POST">
                              <input type="hidden" name="activo" value={String(!item.activo)} />
                              <ConfirmStatusButton activo={item.activo} entidade="categoria" />
                            </form>
                          </div>
                        </td>
                      )}
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
