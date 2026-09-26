'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardIcon,
  SalesIcon,
  ProductsIcon,
  CategoriesIcon,
  StockIcon,
  ReportsIcon,
  UsersIcon,
  HistoryIcon,
  CheckCircleIcon,
  LogoutIcon,
} from '@/src/components/ui/icons';
import { ThemeToggle } from '@/src/components/theme-provider';

export interface AppSidebarProps {
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  };
  onItemClick?: () => void;
  className?: string;
}

export function AppSidebar({ user, onItemClick, className = '' }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.perfil === 'ADMINISTRADOR';

  const adminNavItems = [
    { label: 'Dashboard', href: '/app/admin', icon: <DashboardIcon size={18} /> },
    { label: 'Vendas (PDV)', href: '/app/vendas', icon: <SalesIcon size={18} /> },
    { label: 'Histórico', href: '/app/vendas/historico', icon: <HistoryIcon size={18} /> },
    { label: 'Produtos', href: '/app/admin/produtos', icon: <ProductsIcon size={18} /> },
    { label: 'Categorias', href: '/app/admin/categorias', icon: <CategoriesIcon size={18} /> },
    { label: 'Stock & Movimentos', href: '/app/admin/stock', icon: <StockIcon size={18} /> },
    { label: 'Contagens Cegas', href: '/app/admin/contagens', icon: <CheckCircleIcon size={18} /> },
    { label: 'Relatórios', href: '/app/admin/relatorios', icon: <ReportsIcon size={18} /> },
    { label: 'Utilizadores', href: '/app/admin/users', icon: <UsersIcon size={18} /> },
  ];

  const attendantNavItems = [
    { label: 'Início', href: '/app/atendente', icon: <DashboardIcon size={18} /> },
    { label: 'Ponto de Venda', href: '/app/vendas', icon: <SalesIcon size={18} /> },
    { label: 'Histórico', href: '/app/vendas/historico', icon: <HistoryIcon size={18} /> },
    { label: 'Consultar Produtos', href: '/app/admin/produtos', icon: <ProductsIcon size={18} /> },
  ];

  const navItems = isAdmin ? adminNavItems : attendantNavItems;

  const isActive = (href: string) => {
    if (href === '/app/admin' || href === '/app/atendente') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`flex h-full flex-col justify-between bg-white dark:bg-[#121824] text-zinc-900 dark:text-zinc-100 border-r border-black/5 dark:border-white/5 select-none transition-colors duration-200 ${className}`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-black/5 dark:border-white/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-base shadow-sm">
            RJ
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-zinc-900 dark:text-white leading-tight truncate">
              Take Away Rui Júnior
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-600 dark:text-zinc-400">
              {isAdmin ? 'Painel Gerencial' : 'Terminal Balcão'}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-3">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center gap-3.5 rounded-full px-4 py-2.5 text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`shrink-0 flex items-center justify-center w-5 h-5 transition-colors ${
                      active
                        ? 'text-white dark:text-black'
                        : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile & Controls */}
      <div className="p-4 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A202C] border border-black/5 dark:border-white/5">
          <Link
            href="/app/perfil"
            onClick={onItemClick}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs">
              {user.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                {user.nome}
              </p>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                {user.perfil}
              </p>
            </div>
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              title="Terminar sessão"
              aria-label="Terminar sessão"
            >
              <LogoutIcon size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
