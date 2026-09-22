import { redirect } from 'next/navigation';
import { requireRole } from '@/src/lib/auth';
import { getCategories, getProductById } from '@/src/lib/catalog';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { FormField, Input, Select, Textarea } from '@/src/components/ui/input';
import { ArrowLeftIcon } from '@/src/components/ui/icons';

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMINISTRADOR', '/login');
  const { id } = await params;
  const produtoId = Number(id);
  const [produto, categorias] = await Promise.all([getProductById(produtoId), getCategories()]);

  if (!produto) redirect('/app/admin/produtos');

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/app/admin/produtos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeftIcon size={14} />
            <span>Voltar ao Catálogo</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Editar Produto</h1>
          <p className="text-xs text-slate-500 mt-0.5">#{produto.codigo} — {produto.nome}</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="p-6">
          <form action="/api/admin/produtos" method="POST" className="grid gap-5 sm:grid-cols-2">
            <input type="hidden" name="id" value={produto.id} />

            <FormField label="Código do Produto" id="codigo" required>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={produto.codigo}
                required
              />
            </FormField>

            <FormField label="Nome do Produto" id="nome" required>
              <Input
                id="nome"
                name="nome"
                defaultValue={produto.nome}
                required
              />
            </FormField>

            <FormField label="Descrição" id="descricao" className="sm:col-span-2">
              <Textarea
                id="descricao"
                name="descricao"
                rows={3}
                defaultValue={produto.descricao ?? ''}
              />
            </FormField>

            <FormField label="Categoria" id="categoriaId" required className="sm:col-span-2">
              <Select id="categoriaId" name="categoriaId" defaultValue={String(produto.categoriaId)} required>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Preço de Compra (MT)" id="precoCompra" required>
              <Input
                id="precoCompra"
                name="precoCompra"
                type="number"
                min="0"
                step="0.01"
                defaultValue={String(produto.precoCompra)}
                required
              />
            </FormField>

            <FormField label="Preço de Venda (MT)" id="precoVenda" required>
              <Input
                id="precoVenda"
                name="precoVenda"
                type="number"
                min="0"
                step="0.01"
                defaultValue={String(produto.precoVenda)}
                required
              />
            </FormField>

            <FormField label="Stock Mínimo de Alerta" id="stockMinimo" required>
              <Input
                id="stockMinimo"
                name="stockMinimo"
                type="number"
                min="0"
                step="1"
                defaultValue={String(produto.stockMinimo)}
                required
              />
            </FormField>

            <FormField label="Estado" id="activo" required>
              <Select id="activo" name="activo" defaultValue={String(produto.activo)}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </FormField>

            <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/app/admin/produtos"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </Link>
              <Button type="submit" variant="primary" size="md">
                Guardar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
