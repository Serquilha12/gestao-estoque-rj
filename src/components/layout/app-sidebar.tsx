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
} from '@/src/components/ui/icons';
import { Badge } from '@/src/components/ui/badge';

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
    { label: 'Histórico de Vendas', href: '/app/vendas/historico', icon: <HistoryIcon size={18} /> },
    { label: 'Produtos', href: '/app/admin/produtos', icon: <ProductsIcon size={18} /> },
    { label: 'Categorias', href: '/app/admin/categorias', icon: <CategoriesIcon size={18} /> },
    { label: 'Stock & Auditoria', href: '/app/admin/stock', icon: <StockIcon size={18} /> },
    { label: 'Contagens Cegas', href: '/app/admin/contagens', icon: <CheckCircleIcon size={18} /> },
    { label: 'Relatórios', href: '/app/admin/relatorios', icon: <ReportsIcon size={18} /> },
    { label: 'Utilizadores', href: '/app/admin/users', icon: <UsersIcon size={18} /> },
  ];

  const attendantNavItems = [
    { label: 'Dashboard', href: '/app/atendente', icon: <DashboardIcon size={18} /> },
    { label: 'Nova Venda (PDV)', href: '/app/vendas', icon: <SalesIcon size={18} /> },
    { label: 'Histórico de Vendas', href: '/app/vendas/historico', icon: <HistoryIcon size={18} /> },
    { label: 'Produtos', href: '/app/admin/produtos', icon: <ProductsIcon size={18} /> },
  ];

  const navItems = isAdmin ? adminNavItems : attendantNavItems;

  const isActive = (href: string) => {
    if (href === '/app/admin' || href === '/app/atendente') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`flex h-full flex-col justify-between bg-slate-900 text-slate-300 border-r border-slate-800/80 select-none ${className}`}>
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-md shadow-emerald-950/40 border border-emerald-500/20">
            RJ
          </div>
          <div>
            <span className="block text-sm font-black tracking-tight text-white leading-tight">
              Rui Junior
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-emerald-400">
              Take Away • Vendas
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navegação Principal
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-950/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile & Access Tag */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <Link
          href="/app/perfil"
          onClick={onItemClick}
          className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-800/60 transition group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 group-hover:bg-emerald-900/60 group-hover:text-emerald-400 transition font-bold text-xs">
            {user.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition">
              {user.nome}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant={isAdmin ? 'neutral' : 'info'} className="text-[9px] py-0 px-1.5 font-bold">
                {user.perfil}
              </Badge>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
