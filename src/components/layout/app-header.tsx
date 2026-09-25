'use client';

import React from 'react';
import Link from 'next/link';
import { MenuIcon, PlusIcon, LogoutIcon } from '@/src/components/ui/icons';
import { ThemeToggle } from '@/src/components/theme-provider';

export interface AppHeaderProps {
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  };
  onOpenMobileMenu: () => void;
}

export function AppHeader({ user, onOpenMobileMenu }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#121824]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors duration-200">
      {/* Left: Mobile Toggle & Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden inline-flex items-center justify-center rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
          aria-label="Abrir menu de navegação"
        >
          <MenuIcon size={18} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-white">
            Take Away Rui Júnior
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {user.perfil === 'ADMINISTRADOR' ? 'Gestão Administrativa' : 'Frente de Balcão'}
          </span>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle & User */}
      <div className="flex items-center gap-3">
        {/* PDV Quick Action */}
        <Link
          href="/app/vendas"
          className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-xs font-semibold shadow-xs hover:opacity-90 active:scale-98 transition"
        >
          <PlusIcon size={14} />
          <span>Nova Venda</span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar */}
        <Link
          href="/app/perfil"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F5F7] dark:bg-[#1A202C] border border-black/5 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:opacity-80 transition"
          title={`Perfil de ${user.nome}`}
        >
          {user.nome.slice(0, 2).toUpperCase()}
        </Link>

        <form action="/api/auth/logout" method="POST" className="hidden sm:block">
          <button
            type="submit"
            className="p-2 rounded-full text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            title="Terminar sessão"
            aria-label="Terminar sessão"
          >
            <LogoutIcon size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
