import { requireAuth } from '@/src/lib/auth';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { ArrowLeftIcon } from '@/src/components/ui/icons';

export default async function PerfilPage() {
  const user = await requireAuth('/login');
  const isAdmin = user.perfil === 'ADMINISTRADOR';

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={isAdmin ? '/app/admin' : '/app/atendente'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeftIcon size={14} />
            <span>Voltar ao Painel</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">O Meu Perfil</h1>
          <p className="text-xs text-slate-500 mt-0.5">Detalhes da conta e permissões activas</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl shadow-xs">
              {user.nome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.nome}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
              <div className="mt-2">
                <Badge variant={isAdmin ? 'neutral' : 'info'}>
                  {user.perfil}
                </Badge>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
              <dt className="font-bold text-slate-400 uppercase tracking-wider">Identificador de Utilizador</dt>
              <dd className="mt-1 font-extrabold text-slate-900 text-sm">#{user.id}</dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
              <dt className="font-bold text-slate-400 uppercase tracking-wider">Estado da Conta</dt>
              <dd className="mt-1">
                <Badge variant="success">Activa & Autorizada</Badge>
              </dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 sm:col-span-2">
              <dt className="font-bold text-slate-400 uppercase tracking-wider">Nível de Acesso no Sistema</dt>
              <dd className="mt-1 font-medium text-slate-700">
                {isAdmin
                  ? 'Acesso irrestrito a configurações executivas, relatórios, gestão de utilizadores, catálogo e inventário.'
                  : 'Acesso operacional ao Ponto de Venda (PDV), emissão de comprovativos e consulta de disponibilidade de catálogo.'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
