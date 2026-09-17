'use client';

import React, { useState } from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { CloseIcon } from '@/src/components/ui/icons';
import { ToastProvider } from '@/src/components/ui/toast';

export interface DashboardLayoutProps {
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  };
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
        {/* 1. Desktop Fixed Vertical Sidebar */}
        <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col">
          <AppSidebar user={user} className="w-64 h-full" />
        </div>

      {/* 2. Mobile Drawer / Off-Canvas Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Close Button Top Right */}
            <div className="absolute top-4 right-3 z-10">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                aria-label="Fechar menu"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <AppSidebar
              user={user}
              onItemClick={() => setMobileMenuOpen(false)}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* 3. Main Application Content Area (Right Side) */}
      <div className="md:pl-64 flex flex-1 flex-col min-w-0">
        <AppHeader
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
