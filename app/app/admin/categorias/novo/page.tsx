import { redirect } from 'next/navigation';
import { getCurrentUser, requireRole } from '@/src/lib/auth';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { FormField, Input, Textarea } from '@/src/components/ui/input';
import { ArrowLeftIcon } from '@/src/components/ui/icons';

export default async function NovaCategoriaPage() {
  await requireRole('ADMINISTRADOR', '/login');
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    redirect('/login');
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/app/admin/categorias"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeftIcon size={14} />
            <span>Voltar às Categorias</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Nova Categoria</h1>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="p-6">
          <form action="/api/admin/categorias" method="POST" className="space-y-4">
            <FormField label="Nome da Categoria" id="nome" required>
              <Input
                id="nome"
                name="nome"
                required
                placeholder="Ex: Bebidas & Refrigerantes"
              />
            </FormField>

            <FormField label="Descrição (Opcional)" id="descricao">
              <Textarea
                id="descricao"
                name="descricao"
                rows={3}
                placeholder="Breve descrição da categoria de produtos..."
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/app/admin/categorias"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </Link>
              <Button type="submit" variant="primary" size="md">
                Guardar Categoria
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
