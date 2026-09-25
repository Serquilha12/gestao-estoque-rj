'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input, FormField } from '@/src/components/ui/input';
import {
  CashIcon,
  PhoneIcon,
  CreditCardIcon,
  ReceiptIcon,
  CloseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '@/src/components/ui/icons';

export type MetodoPagamento = 'DINHEIRO' | 'MPESA' | 'EMOLA' | 'CARTAO' | 'OUTRO';

export interface CheckoutPayload {
  metodoPagamento: MetodoPagamento;
  valorRecebido?: number;
  troco?: number;
  referenciaPagamento?: string;
  observacoes?: string;
}

export interface CheckoutModalProps {
  isOpen: boolean;
  total: number;
  quantidadeItens: number;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (payload: CheckoutPayload) => void;
}

export function CheckoutModal(props: CheckoutModalProps) {
  if (!props.isOpen) return null;
  return <CheckoutDialog {...props} />;
}

function CheckoutDialog({
  total,
  quantidadeItens,
  isProcessing,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [metodo, setMetodo] = useState<MetodoPagamento>('DINHEIRO');
  const [valorRecebido, setValorRecebido] = useState<string>(() => total.toString());
  const [referencia, setReferencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');

  // Keyboard shortcut listener (Escape to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, onClose]);

  const numValorRecebido = Number(valorRecebido) || 0;
  const troco = Math.max(0, numValorRecebido - total);
  const valorInsuficiente = metodo === 'DINHEIRO' && numValorRecebido < total;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorInsuficiente || isProcessing) return;

    onConfirm({
      metodoPagamento: metodo,
      valorRecebido: metodo === 'DINHEIRO' ? numValorRecebido : total,
      troco: metodo === 'DINHEIRO' ? troco : 0,
      referenciaPagamento: referencia.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    });
  };

  const handleQuickCash = (amount: number) => {
    setValorRecebido(amount.toString());
  };

  const cashSuggestions = [
    total,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    500,
    1000,
    2000,
  ].filter((v, i, arr) => v >= total && arr.indexOf(v) === i).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-[#121824] p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <ReceiptIcon size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">Finalizar Venda</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {quantidadeItens} {quantidadeItens === 1 ? 'artigo' : 'artigos'} no pedido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-white transition"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Total Display */}
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Total a Cobrar</p>
              <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                {total.toFixed(2)} <span className="text-sm font-bold text-neutral-500">MT</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1 text-xs font-bold shadow-xs">
                Pronto para Fecho
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'DINHEIRO' as const, label: 'Dinheiro', icon: <CashIcon size={18} /> },
                { id: 'MPESA' as const, label: 'M-Pesa', icon: <PhoneIcon size={18} /> },
                { id: 'EMOLA' as const, label: 'e-Mola', icon: <PhoneIcon size={18} /> },
                { id: 'CARTAO' as const, label: 'Cartão/POS', icon: <CreditCardIcon size={18} /> },
                { id: 'OUTRO' as const, label: 'Outro', icon: <ReceiptIcon size={18} /> },
              ].map((item) => {
                const active = metodo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMetodo(item.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all duration-150 ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className={active ? 'text-inherit' : 'text-neutral-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Content by Method */}
          {metodo === 'DINHEIRO' ? (
            <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-4">
              <FormField label="Valor entregue pelo cliente (MT)" id="valorRecebido" required>
                <Input
                  id="valorRecebido"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  placeholder="0.00"
                  className="font-bold text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                  autoFocus
                />
              </FormField>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mr-1">Sugestões:</span>
                {cashSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleQuickCash(sug)}
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-white transition"
                  >
                    {sug === total ? 'Exato' : `${sug} MT`}
                  </button>
                ))}
              </div>

              {/* Change / Troco Indicator */}
              <div className="mt-3 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                {valorInsuficiente ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
                    <AlertTriangleIcon size={16} className="shrink-0" />
                    <span>Faltam {(total - numValorRecebido).toFixed(2)} MT para cobrir o total.</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon size={18} className="text-white dark:text-neutral-950" />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Troco a Devolver:
                      </span>
                    </div>
                    <span className="text-xl font-black">
                      {troco.toFixed(2)} MT
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-4">
              <FormField
                label={
                  metodo === 'MPESA' || metodo === 'EMOLA'
                    ? 'Código de Transação / SMS (Opcional)'
                    : 'Referência do Pagamento (Opcional)'
                }
                id="referencia"
              >
                <Input
                  id="referencia"
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ex: 8A47X90KP..."
                  className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                />
              </FormField>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Registo manual de controlo financeiro. O valor total de {total.toFixed(2)} MT será atribuído a {metodo}.
              </p>
            </div>
          )}

          {/* Observations */}
          <FormField label="Observações do Pedido / Cozinha (Opcional)" id="observacoes">
            <Input
              id="observacoes"
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Para levar, sem picante, mesa balcão..."
              className="text-xs bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
            />
          </FormField>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isProcessing}
              onClick={onClose}
              className="text-xs font-bold border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancelar (ESC)
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={valorInsuficiente || isProcessing}
              isLoading={isProcessing}
              className="text-xs font-bold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
              rightIcon={<ArrowRightIcon size={16} />}
            >
              {isProcessing ? 'A Processar...' : `Confirmar Venda (${total.toFixed(2)} MT)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
