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
      <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#090D14] text-zinc-900 dark:text-zinc-100 flex transition-colors duration-200">
        {/* 1. Desktop Sticky Vertical Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen z-30">
          <AppSidebar user={user} className="w-64 h-full" />
        </aside>

        {/* 2. Mobile Drawer / Off-Canvas Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer container */}
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-[#121824] shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="absolute top-4 right-3 z-10">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F5F7] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition cursor-pointer"
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
        <div className="flex flex-1 flex-col min-w-0">
          <AppHeader
            user={user}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <div className="flex-1 w-full">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
