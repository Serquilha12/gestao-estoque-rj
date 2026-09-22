'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/src/components/ui/button';
import { Input, FormField } from '@/src/components/ui/input';
import { AlertBanner } from '@/src/components/ui/states';

const initialState = { message: '' };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-900 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,150,105,0.1)_0,transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-lg shadow-emerald-950/50 mb-4 border border-emerald-500/30">
            RJ
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400">Take Away</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Rui Junior Vendas</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Sistema de Gestão Comercial e Ponto de Venda
          </p>
        </div>

        {/* Login Form */}
        <form action={formAction} className="space-y-4">
          <FormField label="Email institucional" id="email" required className="[&_label]:text-slate-300">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="utilizador@tkvendas.dev"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </FormField>

          <FormField label="Palavra-passe" id="password" required className="[&_label]:text-slate-300">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </FormField>

          {state?.message ? (
            <AlertBanner
              type="error"
              message={state.message}
              className="bg-rose-950/50 border-rose-800/60 text-rose-200 [&_svg]:text-rose-400"
            />
          ) : null}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 text-white font-bold py-3 rounded-xl"
            >
              {isPending ? 'A autenticar...' : 'Entrar no Sistema'}
            </Button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Take Away Rui Junior • Acesso Restrito
          </p>
        </div>
      </div>
    </main>
  );
}
