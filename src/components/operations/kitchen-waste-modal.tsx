'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input, FormField } from '@/src/components/ui/input';
import { CloseIcon, AlertTriangleIcon } from '@/src/components/ui/icons';
import { useToast } from '@/src/components/ui/toast';

interface ProdutoItem {
  id: number;
  codigo: string;
  nome: string;
}

interface KitchenWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function KitchenWasteDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const toast = useToast();
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [produtoId, setProdutoId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('1');
  const [motivoTipo, setMotivoTipo] = useState<string>('Queimou no preparo');
  const [motivoDetalhe, setMotivoDetalhe] = useState<string>('');
  const [isCarregandoProdutos, setIsCarregandoProdutos] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch('/api/operacoes/contagem-cega')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const list = data.produtos ?? [];
        setProdutos(list);
        if (list.length > 0) {
          setProdutoId(String(list[0].id));
        }
        setIsCarregandoProdutos(false);
      })
      .catch(() => {
        if (!ignore) setIsCarregandoProdutos(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pId = Number(produtoId);
    const qtd = Number(quantidade);

    if (!pId || qtd <= 0) {
      toast.warning('Selecione um produto e quantidade válida.');
      return;
    }

    const motivoFinal = motivoDetalhe.trim()
      ? `${motivoTipo} - ${motivoDetalhe.trim()}`
      : motivoTipo;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/operacoes/quebra', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          produtoId: pId,
          quantidade: qtd,
          motivo: motivoFinal,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao registar quebra.');
        return;
      }

      toast.success('Quebra de cozinha documentada com sucesso!', 'Registo de Quebra');
      onSuccess?.();
      onClose();
    } catch {
      setIsSubmitting(false);
      toast.error('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangleIcon size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Registar Quebra / Perda</h2>
              <p className="text-xs text-slate-500">Documentação operacional de cozinha</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField label="Produto com Quebra / Descarte" id="produtoId" required>
            {isCarregandoProdutos ? (
              <p className="text-xs text-slate-400 py-2">A carregar catálogo...</p>
            ) : (
              <select
                id="produtoId"
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                required
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.codigo}] {p.nome}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Quantidade Perdida / Quebrada" id="quantidade" required>
            <Input
              id="quantidade"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="text-xs font-bold"
              required
            />
          </FormField>

          <FormField label="Tipo de Ocorrência" id="motivoTipo" required>
            <select
              id="motivoTipo"
              value={motivoTipo}
              onChange={(e) => setMotivoTipo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
            >
              <option value="Queimou no preparo">Queimou na chapa / fritura</option>
              <option value="Derrubado / Queda acidental">Derrubado / Queda acidental</option>
              <option value="Erro no pedido da cozinha">Erro no pedido da cozinha</option>
              <option value="Produto impróprio / Azedou">Produto impróprio / Azedou</option>
              <option value="Embalagem danificada">Embalagem danificada</option>
              <option value="Outro motivo">Outro motivo</option>
            </select>
          </FormField>

          <FormField label="Detalhes adicionais (Opcional)" id="motivoDetalhe">
            <Input
              id="motivoDetalhe"
              type="text"
              value={motivoDetalhe}
              onChange={(e) => setMotivoDetalhe(e.target.value)}
              placeholder="Ex: Caiu durante empratamento na mesa 2..."
              className="text-xs"
            />
          </FormField>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
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
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Registar Quebra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function KitchenWasteModal({ isOpen, onClose, onSuccess }: KitchenWasteModalProps) {
  if (!isOpen) return null;
  return <KitchenWasteDialog onClose={onClose} onSuccess={onSuccess} />;
}
