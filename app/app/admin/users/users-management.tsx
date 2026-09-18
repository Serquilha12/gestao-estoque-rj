'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { FormField, Input, Select } from '@/src/components/ui/input';
import { PlusIcon, UserXIcon, ShieldIcon } from '@/src/components/ui/icons';

type User = {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  activo: boolean;
  criadoEm: string;
};

export function UsersManagement({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeUsers = users.filter((u) => u.activo);
  const activeAdmins = activeUsers.filter((u) => u.perfil === 'ADMINISTRADOR').length;
  const activeAtendentes = activeUsers.filter((u) => u.perfil === 'ATENDENTE').length;

  async function handleCreate(formData: FormData) {
    setError(null);
    setSuccess(null);

    const body = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      password: formData.get('password'),
      perfil: formData.get('perfil'),
      activo: true,
    };

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar utilizador.');
        return;
      }

      setSuccess(`Utilizador "${data.user?.nome}" criado com sucesso!`);
      startTransition(() => router.refresh());
    } catch {
      setError('Erro de rede ao criar utilizador.');
    }
  }

  async function handleToggleStatus(userId: number, currentlyActive: boolean) {
    setError(null);
    setSuccess(null);

    if (currentlyActive) {
      // Desactivar
      try {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erro ao desactivar utilizador.');
          return;
        }
        setSuccess('Utilizador desactivado com sucesso.');
        startTransition(() => router.refresh());
      } catch {
        setError('Erro de rede.');
      }
    } else {
      // Reactivar via PUT
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      try {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            activo: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erro ao reactivar utilizador.');
          return;
        }
        setSuccess('Utilizador reactivado com sucesso.');
        startTransition(() => router.refresh());
      } catch {
        setError('Erro de rede.');
      }
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Administração de Sistema</Badge>
            <span className="text-xs text-slate-400 dark:text-zinc-500">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{activeUsers.length}/3 utilizadores activos</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Utilizadores
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Controlo de acessos, criação de operadores e atribuição de perfis de segurança.
          </p>
          {/* Limites */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px]">
              <ShieldIcon size={13} className="text-zinc-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Admins: <strong className="text-zinc-900 dark:text-white">{activeAdmins}/1</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <UserXIcon size={13} className="text-zinc-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Atendentes: <strong className="text-zinc-900 dark:text-white">{activeAtendentes}/2</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}

      {/* Grid: Create User Form + User List Table */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* User Creation Card */}
        <div className="lg:col-span-4">
          <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121824] shadow-xs">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
                  <PlusIcon size={16} />
                </div>
                <div>
                  <CardTitle className="text-base">Novo Utilizador</CardTitle>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Criar credencial de acesso ao sistema</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await handleCreate(formData);
                  (e.target as HTMLFormElement).reset();
                }}
                className="space-y-3.5"
              >
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
                    placeholder="Mínimo 8 caracteres"
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
                  disabled={isPending || activeUsers.length >= 3}
                >
                  {activeUsers.length >= 3 ? 'Limite de Utilizadores Atingido' : 'Criar Utilizador'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Users List Table */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Contas de Utilizador</CardTitle>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Todos os operadores com acesso ao sistema</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
                  <thead className="bg-slate-50 dark:bg-zinc-900/50 text-[11px] uppercase font-bold text-slate-500 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Utilizador</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3 text-center">Perfil</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Acções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${item.activo ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200' : 'bg-slate-100/50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600'}`}>
                              {item.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold ${item.activo ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-600 line-through'}`}>{item.nome}</p>
                              {item.id === currentUserId && (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">(Sua sessão)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 font-medium ${item.activo ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-400 dark:text-zinc-600'}`}>
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
                        <td className="px-4 py-3 text-center">
                          {item.id !== currentUserId && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleStatus(item.id, item.activo)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                item.activo
                                  ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50'
                                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50'
                              }`}
                              title={item.activo ? 'Desactivar este utilizador' : 'Reactivar este utilizador'}
                            >
                              <UserXIcon size={13} />
                              {item.activo ? 'Desactivar' : 'Reactivar'}
                            </button>
                          )}
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
