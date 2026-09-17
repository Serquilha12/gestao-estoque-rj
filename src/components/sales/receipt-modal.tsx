'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/button';
import { PrinterIcon, CheckCircleIcon, CloseIcon } from '@/src/components/ui/icons';

export interface ReceiptItem {
  id: number;
  nome: string;
  quantidade: number;
  precoVenda: string | number;
  notas?: string;
}

export interface ReceiptData {
  id: number;
  dataHora: string;
  atendenteNome?: string;
  metodoPagamento: string;
  valorRecebido?: number;
  troco?: number;
  referenciaPagamento?: string;
  total: number;
  itens: ReceiptItem[];
}

export interface ReceiptModalProps {
  receipt: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export function ReceiptModal({ receipt, isOpen, onClose, onNewSale }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Handle Enter to print and Escape to finish
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.print();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onNewSale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNewSale]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMetodoLabel = (metodo: string) => {
    switch (metodo?.toUpperCase()) {
      case 'MPESA':
      case 'M-PESA':
        return 'M-Pesa (Vodacom)';
      case 'EMOLA':
      case 'E-MOLA':
        return 'e-Mola (Movitel)';
      case 'CARTAO':
      case 'POS':
        return 'Cartão / POS';
      case 'DINHEIRO':
        return 'Dinheiro Físico';
      default:
        return 'Outro / Transferência';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Container - hide non-receipt on print */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Action Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircleIcon size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">Venda Concluída com Sucesso!</h2>
              <p className="text-xs text-slate-500">Talão pronto para entrega ou impressão</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto my-4 px-1 py-1 flex-1 flex justify-center">
          {/* Printable Ticket (Styled like 80mm thermal paper) */}
          <div
            ref={receiptRef}
            id="thermal-receipt"
            className="w-full max-w-[340px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 font-mono text-xs text-slate-800 shadow-inner print:max-w-none print:border-none print:p-0 print:shadow-none print:bg-white"
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
              <p className="text-sm font-black uppercase tracking-wider text-slate-900">Take Away Rui Júnior</p>
              <p className="text-[10px] text-slate-600">Serviço de Restauração & Balcão</p>
              <p className="text-[10px] text-slate-500">Pemba • Cabo Delgado</p>
              <p className="text-[10px] text-slate-500">Tel: +258 84 000 0000</p>
            </div>

            {/* Sale metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Talão Nº:</span>
                <span className="font-bold text-slate-900">#{receipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data/Hora:</span>
                <span className="text-slate-700">{receipt.dataHora}</span>
              </div>
              {receipt.atendenteNome && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Operador:</span>
                  <span className="text-slate-700">{receipt.atendenteNome}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Pagamento:</span>
                <span className="font-semibold text-emerald-800">{getMetodoLabel(receipt.metodoPagamento)}</span>
              </div>
              {receipt.referenciaPagamento && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Ref:</span>
                  <span className="font-mono text-slate-700">{receipt.referenciaPagamento}</span>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Qtd • Artigo</span>
                <span>Total</span>
              </div>
              {receipt.itens.map((item) => {
                const subtotal = Number(item.precoVenda) * item.quantidade;
                return (
                  <div key={item.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-slate-900">
                        {item.quantidade}x {item.nome}
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        {subtotal.toFixed(2)} MT
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>@ {Number(item.precoVenda).toFixed(2)} MT</span>
                    </div>
                    {item.notas && (
                      <p className="text-[10px] italic text-amber-700 mt-0.5">
                        Obs: {item.notas}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financial Totals */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
                <span>TOTAL A PAGAR:</span>
                <span className="text-emerald-700">{receipt.total.toFixed(2)} MT</span>
              </div>

              {receipt.valorRecebido !== undefined && receipt.valorRecebido > 0 && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                    <span>Valor Entregue:</span>
                    <span>{receipt.valorRecebido.toFixed(2)} MT</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-800">
                    <span>Troco:</span>
                    <span className="text-emerald-800 font-black">
                      {(receipt.troco ?? Math.max(0, receipt.valorRecebido - receipt.total)).toFixed(2)} MT
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer message */}
            <div className="pt-4 text-center space-y-1 text-[10px] text-slate-500">
              <p className="font-bold text-slate-700">OBRIGADO PELA PREFERÊNCIA!</p>
              <p>Conserve este talão para qualquer esclarecimento.</p>
              <p className="text-[9px] text-slate-400 pt-1">TK Rui Júnior • Sistema de Gestão Comercial</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={onNewSale}
            className="flex-1 text-xs font-bold py-2.5"
          >
            Nova Venda (ESC)
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrint}
            className="flex-1 text-xs font-bold py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/20"
            leftIcon={<PrinterIcon size={16} />}
          >
            Imprimir Talão (Ctrl+P)
          </Button>
        </div>
      </div>
    </div>
  );
}
