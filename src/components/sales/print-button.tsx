'use client';

import React from 'react';
import { Button } from '@/src/components/ui/button';
import { PrinterIcon } from '@/src/components/ui/icons';

export function PrintReceiptButton({ label = 'Imprimir Comprovativo' }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="text-xs font-bold gap-2 print:hidden"
      leftIcon={<PrinterIcon size={16} />}
    >
      {label}
    </Button>
  );
}
