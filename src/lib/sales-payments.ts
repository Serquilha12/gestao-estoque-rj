import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface SalePaymentInfo {
  vendaId: number;
  metodoPagamento: 'DINHEIRO' | 'MPESA' | 'EMOLA' | 'CARTAO' | 'OUTRO';
  total?: string;
  criadoEm?: string;
  referenciaPagamento?: string | null;
}

const BASE_DIR = process.env.VERCEL ? os.tmpdir() : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'sales_payments.json');

let inMemoryPayments: Record<number, SalePaymentInfo> = {};

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch {
    // Falha silenciosa
  }
}

export function getAllSalePayments(): Record<number, SalePaymentInfo> {
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...parsed, ...inMemoryPayments };
      }
    }
  } catch {
    // Fallback
  }
  return inMemoryPayments;
}

export function recordSalePayment(payment: SalePaymentInfo) {
  inMemoryPayments[payment.vendaId] = payment;
  ensureDataFile();
  try {
    const current = getAllSalePayments();
    current[payment.vendaId] = payment;
    fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch {
    // Mantém em memória
  }
}

export function getSalePaymentMethod(
  vendaId: number,
  fallbackFromMotivo?: string | null
): 'DINHEIRO' | 'MPESA' | 'EMOLA' | 'CARTAO' | 'OUTRO' {
  const all = getAllSalePayments();
  if (all[vendaId]?.metodoPagamento) {
    return all[vendaId].metodoPagamento;
  }

  // Tenta extrair do motivo do MovimentoStock (ex: "Venda #10 [MPESA]")
  if (fallbackFromMotivo) {
    const match = fallbackFromMotivo.match(/\[(DINHEIRO|MPESA|EMOLA|CARTAO|OUTRO)\]/i);
    if (match?.[1]) {
      return match[1].toUpperCase() as 'DINHEIRO' | 'MPESA' | 'EMOLA' | 'CARTAO' | 'OUTRO';
    }
  }

  return 'DINHEIRO';
}
