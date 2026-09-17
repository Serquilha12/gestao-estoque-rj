'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { AlertTriangleIcon } from '@/src/components/ui/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangleIcon size={28} />
        </div>
        <h1 className="text-xl font-black text-white">Ocorreu um erro inesperado</h1>
        <p className="mt-2 text-xs text-slate-400">
          {error.message || 'Não foi possível carregar a página solicitada.'}
        </p>

        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-slate-500">
            Código: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl"
          >
            Tentar novamente
          </Button>

          <Link href="/login" className="w-full">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 font-medium py-2.5 rounded-xl"
            >
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
