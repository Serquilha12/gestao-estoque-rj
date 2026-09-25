'use client';

import { useActionState, useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { ThemeToggle } from '@/src/components/theme-provider';

const initialState = { message: '' };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillAccount = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#F4F5F7] dark:bg-[#090D14] transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px]">
        {/* Card Container */}
        <div className="bg-white dark:bg-[#121824] rounded-3xl border border-black/5 dark:border-white/10 p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-none transition-all">
          {/* Logo / Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-13 h-13 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xl tracking-tight shadow-md mb-4">
              RJ
            </div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
              Take Away Rui Júnior
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
              Terminal Comercial
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Introduza as suas credenciais para aceder
            </p>
          </div>

          {/* Quick Access Account Selector */}
          <div className="mb-6 p-1.5 rounded-2xl bg-[#F4F5F7] dark:bg-[#0E131F] border border-black/5 dark:border-white/5 flex gap-1">
            <button
              type="button"
              onClick={() => fillAccount('admin@tkrui.co.mz', 'admin123')}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
            >
              👑 Administrador
            </button>
            <button
              type="button"
              onClick={() => fillAccount('atendente@tkrui.co.mz', 'admin123')}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
            >
              💼 Atendente
            </button>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Endereço de Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="exemplo@tkrui.co.mz"
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A202C] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Palavra-passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A202C] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            {state?.message ? (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {state.message}
              </div>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isPending ? 'A autenticar...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5 text-center">
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Ambiente Seguro • Take Away Rui Júnior
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
