'use client';

import { useActionState, useState } from 'react';
import { loginAction } from '@/app/actions/auth';

const initialState = { message: '' };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F4F5F7] text-zinc-900">
      <div className="w-full max-w-[390px]">
        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-black/5 p-7 sm:p-9 shadow-xl shadow-black/5 transition-all">
          {/* Logo / Brand Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg tracking-tight shadow-xs mb-3.5">
              RJ
            </div>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
              Take Away Rui Júnior
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
              Terminal Comercial
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Introduza as suas credenciais para aceder
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-black/10 text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-black/10 text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition"
              />
            </div>

            {state?.message ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {state.message}
              </div>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 rounded-xl bg-black text-white font-semibold text-xs sm:text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isPending ? 'A autenticar...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-black/5 text-center">
            <p className="text-[11px] text-zinc-500">
              Ambiente Seguro • Take Away Rui Júnior
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
