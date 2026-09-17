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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ReceiptIcon size={20} />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Finalizar Venda</h2>
              <p className="text-xs text-slate-500">
                {quantidadeItens} {quantidadeItens === 1 ? 'artigo' : 'artigos'} no carrinho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Total Display */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">Total a Cobrar</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700">
                {total.toFixed(2)} <span className="text-sm font-bold">MT</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
                Pronto para Fecho
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
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
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Content by Method */}
          {metodo === 'DINHEIRO' ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <FormField label="Valor entregue pelo cliente (MT)" id="valorRecebido" required>
                <Input
                  id="valorRecebido"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  placeholder="0.00"
                  className="font-bold text-base text-slate-900 bg-white"
                  autoFocus
                />
              </FormField>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Sugestões:</span>
                {cashSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleQuickCash(sug)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                  >
                    {sug === total ? 'Exato' : `${sug} MT`}
                  </button>
                ))}
              </div>

              {/* Change / Troco Indicator */}
              <div className="mt-3 pt-3 border-t border-slate-200/80">
                {valorInsuficiente ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 font-bold">
                    <AlertTriangleIcon size={16} className="text-amber-600 shrink-0" />
                    <span>Faltam {(total - numValorRecebido).toFixed(2)} MT para cobrir o total.</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-100/70 border border-emerald-200/60 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon size={18} className="text-emerald-700" />
                      <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900">
                        Troco a Devolver:
                      </span>
                    </div>
                    <span className="text-xl font-black text-emerald-800">
                      {troco.toFixed(2)} MT
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
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
                  className="bg-white text-xs"
                />
              </FormField>
              <p className="text-[11px] text-slate-500">
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
              className="text-xs"
            />
          </FormField>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isProcessing}
              onClick={onClose}
              className="text-xs font-bold"
            >
              Cancelar (ESC)
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={valorInsuficiente || isProcessing}
              isLoading={isProcessing}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/20"
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
