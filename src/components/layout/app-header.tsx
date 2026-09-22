'use client';

import React from 'react';
import Link from 'next/link';
import { MenuIcon, PlusIcon, LogoutIcon, UserIcon } from '@/src/components/ui/icons';
import { Badge } from '@/src/components/ui/badge';

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
  const isAdmin = user.perfil === 'ADMINISTRADOR';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left Area: Mobile Toggle & App Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          aria-label="Abrir menu de navegação"
        >
          <MenuIcon size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            Take Away
          </span>
          <span className="text-xs font-semibold text-slate-500">• Rui Junior Vendas</span>
        </div>
      </div>

      {/* Right Area: Actions, User Info & Logout */}
      <div className="flex items-center gap-3">
        {/* Quick Sale / PDV Shortcut Button */}
        <Link
          href="/app/vendas"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition active:scale-98"
        >
          <PlusIcon size={14} />
          <span>PDV</span>
        </Link>

        {/* User Role Tag */}
        <Link
          href="/app/perfil"
          className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 hover:bg-slate-100/80 transition"
          title="Ver perfil"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
            <UserIcon size={13} />
          </div>
          <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate">{user.nome}</span>
          <Badge variant={isAdmin ? 'neutral' : 'info'} className="text-[9px] py-0 px-1.5 font-bold">
            {user.perfil}
          </Badge>
        </Link>

        {/* Logout Form */}
        <form action="/api/auth/logout" method="POST" className="inline-block">
          <button
            type="submit"
            title="Terminar Sessão"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition"
          >
            <LogoutIcon size={16} />
            <span className="hidden md:inline text-xs font-bold">Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
