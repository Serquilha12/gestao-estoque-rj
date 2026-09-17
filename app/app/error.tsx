'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { AlertTriangleIcon } from '@/src/components/ui/icons';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Area Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertTriangleIcon size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Falha ao carregar dados</h2>
        <p className="mt-2 text-xs text-slate-500">
          {error.message || 'Ocorreu uma instabilidade momentânea na conexão com a base de dados.'}
        </p>

        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-slate-400">
            ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-sm"
          >
            Tentar novamente
          </Button>

          <Link href="/login" className="flex-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-2 rounded-xl text-sm"
            >
              Recarregar Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
