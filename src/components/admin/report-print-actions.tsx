'use client';

import React from 'react';
import { Button } from '@/src/components/ui/button';
import { PrinterIcon, DownloadIcon } from '@/src/components/ui/icons';

export function ReportPrintActions() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Abre a caixa de diálogo de impressão nativa pré-configurada para "Guardar como PDF"
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        onClick={handlePrint}
        className="text-xs font-bold py-2 px-3.5 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs"
        leftIcon={<PrinterIcon size={14} />}
      >
        Imprimir Relatório
      </Button>

      <Button
        type="button"
        variant="primary"
        onClick={handleDownloadPDF}
        className="text-xs font-bold py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
        leftIcon={<DownloadIcon size={14} />}
      >
        Descarregar PDF
      </Button>
    </div>
  );
}
