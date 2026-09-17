'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { CloseIcon, CheckCircleIcon, SearchIcon } from '@/src/components/ui/icons';
import { useToast } from '@/src/components/ui/toast';

interface ProdutoCego {
  id: number;
  codigo: string;
  nome: string;
  categoriaNome: string;
}

type TurnoTipo = 'MANHA' | 'TARDE' | 'NOITE' | 'GERAL';

interface BlindCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function BlindCountDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const toast = useToast();
  const [produtos, setProdutos] = useState<ProdutoCego[]>([]);
  const [contagens, setContagens] = useState<Record<number, string>>({});
  const [turno, setTurno] = useState<TurnoTipo>('NOITE');
  const [observacoes, setObservacoes] = useState('');
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch('/api/operacoes/contagem-cega')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const prods: ProdutoCego[] = data.produtos ?? [];
        setProdutos(prods);

        // Initialize zero or blank counts
        const initial: Record<number, string> = {};
        for (const p of prods) {
          initial[p.id] = '';
        }
        setContagens(initial);
        setIsLoading(false);
      })
      .catch(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
      p.categoriaNome.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalPreenchidos = Object.values(contagens).filter((v) => v !== '').length;

  const handleUpdateCount = (id: number, val: string) => {
    setContagens((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itensParaEnviar = Object.entries(contagens)
      .filter(([, val]) => val !== '' && !Number.isNaN(Number(val)))
      .map(([id, val]) => ({
        produtoId: Number(id),
        quantidadeFisica: Math.max(0, Number(val)),
      }));

    if (itensParaEnviar.length === 0) {
      toast.warning('Preencha a contagem física de pelo menos um produto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/operacoes/contagem-cega', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          turno,
          observacoes: observacoes.trim() || undefined,
          itens: itensParaEnviar,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao submeter contagem.');
        return;
      }

      toast.success(
        `Contagem de turno #${data.numero} submetida com sucesso!`,
        'Auditoria Enviada'
      );
      onSuccess?.();
      onClose();
    } catch {
      setIsSubmitting(false);
      toast.error('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800">
              <CheckCircleIcon size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Contagem Cega de Turno (Inventário Físico)
              </h2>
              <p className="text-xs text-slate-500">
                Insira a quantidade física real de cada item contado na cozinha/balcão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Turn & Filter Row */}
        <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Turno Operacional
            </label>
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value as TurnoTipo)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-cyan-500"
            >
              <option value="NOITE">Fecho de Turno / Noite</option>
              <option value="TARDE">Turno da Tarde</option>
              <option value="MANHA">Abertura / Turno da Manhã</option>
              <option value="GERAL">Inventário Geral</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Filtrar Produtos
            </label>
            <Input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Pesquisar por nome ou código..."
              leftIcon={<SearchIcon size={14} />}
              className="text-xs py-2"
            />
          </div>
        </div>

        {/* Table of products */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              A carregar lista de artigos para contagem...
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhum produto encontrado com o filtro atual.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Código</th>
                  <th className="px-4 py-2.5">Artigo</th>
                  <th className="px-4 py-2.5">Categoria</th>
                  <th className="px-4 py-2.5 text-right w-36">Qtd Física Contada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {produtosFiltrados.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 font-mono text-[11px] font-bold text-slate-600">
                      {prod.codigo}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{prod.nome}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-500">{prod.categoriaNome}</td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={contagens[prod.id] ?? ''}
                        onChange={(e) => handleUpdateCount(prod.id, e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-black text-slate-900 outline-none focus:border-cyan-600 focus:bg-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Observations & Submit */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do atendente no fecho (ex: tudo conferido na câmara fria)..."
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              <strong className="text-slate-800 font-bold">{totalPreenchidos}</strong> de{' '}
              {produtos.length} produtos preenchidos
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={onClose}
                className="text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isSubmitting || totalPreenchidos === 0}
                isLoading={isSubmitting}
                onClick={handleSubmit}
                className="text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white"
              >
                Submeter Contagem
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlindCountModal({ isOpen, onClose, onSuccess }: BlindCountModalProps) {
  if (!isOpen) return null;
  return <BlindCountDialog onClose={onClose} onSuccess={onSuccess} />;
}
