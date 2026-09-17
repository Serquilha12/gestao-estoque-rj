'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { AlertTriangleIcon, CheckCircleIcon } from '@/src/components/ui/icons';
import { KitchenWasteModal } from './kitchen-waste-modal';
import { BlindCountModal } from './blind-count-modal';

export function AttendantQuickActions() {
  const [quebraModalAberto, setQuebraModalAberto] = useState(false);
  const [contagemModalAberto, setContagemModalAberto] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setQuebraModalAberto(true)}
          className="text-xs font-bold gap-1.5 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100"
          leftIcon={<AlertTriangleIcon size={15} className="text-amber-600" />}
        >
          Registar Quebra
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setContagemModalAberto(true)}
          className="text-xs font-bold gap-1.5 border-cyan-300 bg-cyan-50/50 text-cyan-900 hover:bg-cyan-100"
          leftIcon={<CheckCircleIcon size={15} className="text-cyan-600" />}
        >
          Contagem de Turno
        </Button>
      </div>

      <KitchenWasteModal
        isOpen={quebraModalAberto}
        onClose={() => setQuebraModalAberto(false)}
      />

      <BlindCountModal
        isOpen={contagemModalAberto}
        onClose={() => setContagemModalAberto(false)}
      />
    </>
  );
}
