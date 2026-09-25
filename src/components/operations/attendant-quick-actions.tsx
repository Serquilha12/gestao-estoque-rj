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
          leftIcon={<AlertTriangleIcon size={14} className="text-amber-500" />}
        >
          Registar Quebra
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setContagemModalAberto(true)}
          leftIcon={<CheckCircleIcon size={14} className="text-zinc-500" />}
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
