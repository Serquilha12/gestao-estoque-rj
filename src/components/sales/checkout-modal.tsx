'use client';

import React, { useState, useEffect } from 'react';
import { FormField, Input } from '@/src/components/ui/input';
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
  ]
    .filter((v, i, arr) => v >= total && arr.indexOf(v) === i)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121824] shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden">
        {/* ========================================================================= */}
        {/* 1. HEADER (FIXO)                                                          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-4.5 border-b border-black/5 dark:border-white/5 shrink-0 bg-white dark:bg-[#121824]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shrink-0">
              <ReceiptIcon size={18} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Finalizar Venda
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                {quantidadeItens} {quantidadeItens === 1 ? 'artigo selecionado' : 'artigos selecionados'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. FORM BODY (SCROLLÁVEL NO MOBILE / TECLADO VIRTUAL)                     */}
        {/* ========================================================================= */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-4.5">
            {/* Total Display */}
            <div className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1A202C] p-3.5 sm:p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Total a Cobrar
                </p>
                <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {total.toFixed(2)}{' '}
                  <span className="text-xs sm:text-sm font-semibold text-zinc-500">MT</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-[11px] font-bold shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Pronto para Fecho
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { id: 'DINHEIRO' as const, label: 'Dinheiro', icon: <CashIcon size={16} /> },
                  { id: 'MPESA' as const, label: 'M-Pesa', icon: <PhoneIcon size={16} /> },
                  { id: 'EMOLA' as const, label: 'e-Mola', icon: <PhoneIcon size={16} /> },
                  { id: 'CARTAO' as const, label: 'Cartão', icon: <CreditCardIcon size={16} /> },
                  { id: 'OUTRO' as const, label: 'Outro', icon: <ReceiptIcon size={16} /> },
                ].map((item) => {
                  const active = metodo === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMetodo(item.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl border p-2 sm:py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                        active
                          ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-xs'
                          : 'border-black/5 dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1A202C] text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="text-[11px] sm:text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Content by Method */}
            {metodo === 'DINHEIRO' ? (
              <div className="space-y-3 rounded-2xl border border-black/5 dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1A202C] p-3.5 sm:p-4">
                <FormField label="Valor entregue pelo cliente (MT)" id="valorRecebido" required>
                  <Input
                    id="valorRecebido"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    placeholder="0.00"
                    className="font-bold text-base sm:text-lg"
                    autoFocus
                  />
                </FormField>

                {/* Quick Cash Buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Sugestões rápidas:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cashSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleQuickCash(sug)}
                        className="rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#121824] px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition cursor-pointer shadow-2xs"
                      >
                        {sug === total ? 'Valor Exato' : `${sug} MT`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change / Troco Indicator */}
                <div className="pt-2">
                  {valorInsuficiente ? (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400 font-bold">
                      <AlertTriangleIcon size={16} className="shrink-0" />
                      <span>Faltam {(total - numValorRecebido).toFixed(2)} MT para cobrir o total.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl bg-black dark:bg-white text-white dark:text-black p-3.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon size={18} className="shrink-0 text-emerald-400 dark:text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Troco a Devolver:
                        </span>
                      </div>
                      <span className="text-xl sm:text-2xl font-black">
                        {troco.toFixed(2)} MT
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 rounded-2xl border border-black/5 dark:border-white/10 bg-[#F8F9FA] dark:bg-[#1A202C] p-3.5 sm:p-4">
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
                  />
                </FormField>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Registo para auditoria financeira. O valor de {total.toFixed(2)} MT será creditado em {metodo}.
                </p>
              </div>
            )}

            {/* Observations */}
            <FormField label="Observações do Pedido (Opcional)" id="observacoes">
              <Input
                id="observacoes"
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Para levar, sem cebola, mesa balcão..."
              />
            </FormField>
          </div>

          {/* ========================================================================= */}
          {/* 3. FOOTER ACTIONS (FIXO / ADAPTÁVEL MOBILE)                              */}
          {/* ========================================================================= */}
          <div className="p-4 sm:px-6 sm:py-4 border-t border-black/5 dark:border-white/5 bg-white/95 dark:bg-[#121824]/95 backdrop-blur-xs flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-4 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer text-center"
            >
              Cancelar (ESC)
            </button>

            <button
              type="submit"
              disabled={valorInsuficiente || isProcessing}
              className="w-full sm:w-auto py-3 sm:py-2.5 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isProcessing ? 'A Processar...' : `Confirmar Venda • ${total.toFixed(2)} MT`}</span>
              {!isProcessing && <ArrowRightIcon size={14} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
