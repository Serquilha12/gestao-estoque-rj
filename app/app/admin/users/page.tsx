import { redirect } from 'next/navigation';
import { getCurrentUser, requireRole } from '@/src/lib/auth';
import { getUsers } from '@/src/lib/users';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { FormField, Input, Select } from '@/src/components/ui/input';
import { PlusIcon } from '@/src/components/ui/icons';

export default async function AdminUsersPage() {
  const user = await requireRole('ADMINISTRADOR', '/login');
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    redirect('/login');
  }

  const users = await getUsers();

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Administração de Sistema</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">{users.length} contas activas/registadas</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Gestão de Utilizadores
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Controlo de acessos, criação de operadores e atribuição de perfis de segurança.
          </p>
        </div>
      </div>

      {/* Grid: Create User Form + User List Table */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* User Creation Card (5 Cols) */}
        <div className="lg:col-span-4">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
                  <PlusIcon size={16} />
                </div>
                <div>
                  <CardTitle className="text-base">Novo Utilizador</CardTitle>
                  <p className="text-[11px] text-slate-500 mt-0.5">Criar credencial de acesso ao sistema</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form action="/api/admin/users" method="POST" className="space-y-3.5">
                <FormField label="Nome Completo" id="nome" required>
                  <Input
                    id="nome"
                    name="nome"
                    required
                    placeholder="Ex: Carlos Mateus"
                  />
                </FormField>

                <FormField label="Email" id="email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="carlos@exemplo.com"
                  />
                </FormField>

                <FormField label="Palavra-passe" id="password" required>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                  />
                </FormField>

                <FormField label="Perfil de Acesso" id="perfil" required>
                  <Select id="perfil" name="perfil" defaultValue="ATENDENTE">
                    <option value="ATENDENTE">Atendente (Operacional / PDV)</option>
                    <option value="ADMINISTRADOR">Administrador (Acesso Total)</option>
                  </Select>
                </FormField>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-xs font-bold mt-2"
                >
                  Criar Utilizador
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Users List Table (8 Cols) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Contas de Utilizador</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Todos os operadores com acesso ao sistema</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Utilizador</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3 text-center">Perfil</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                              {item.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.nome}</p>
                              {item.id === user.id && (
                                <span className="text-[10px] text-emerald-700 font-semibold">(Sua sessão)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {item.email}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={item.perfil === 'ADMINISTRADOR' ? 'neutral' : 'info'}>
                            {item.perfil}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={item.activo ? 'success' : 'danger'}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
