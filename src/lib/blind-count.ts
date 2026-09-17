import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/src/prisma/db';
import { recordStockAdjustment, recordStockExit } from '@/src/lib/stock';

export interface BlindCountItemInput {
  produtoId: number;
  quantidadeFisica: number;
  notas?: string | null;
}

export interface BlindCountInput {
  turno: 'MANHA' | 'TARDE' | 'NOITE' | 'GERAL';
  observacoes?: string | null;
  itens: BlindCountItemInput[];
}

export interface BlindCountItemRecord {
  produtoId: number;
  produtoCodigo: string;
  produtoNome: string;
  categoriaNome: string;
  quantidadeFisica: number;
  stockSistemaNoMomento: number;
  divergencia: number; // quantidadeFisica - stockSistemaNoMomento
  precoCompraUnitario: number;
  impactoFinanceiro: number; // divergencia * precoCompraUnitario
  notas?: string | null;
}

export interface BlindCountRecord {
  id: string;
  numero: number;
  dataHora: string;
  utilizadorId: number;
  utilizadorNome: string;
  turno: 'MANHA' | 'TARDE' | 'NOITE' | 'GERAL';
  status: 'SUBMETIDA' | 'HOMOLOGADA' | 'REJEITADA';
  observacoes?: string | null;
  totalItensContados: number;
  totalDivergencias: number;
  impactoFinanceiroTotal: number;
  itens: BlindCountItemRecord[];
  homologadoEm?: string | null;
  homologadoPor?: string | null;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'blind-counts.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readAllCounts(): BlindCountRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as BlindCountRecord[];
  } catch {
    return [];
  }
}

function saveAllCounts(counts: BlindCountRecord[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(counts, null, 2), 'utf-8');
}

/**
 * Atendente submete contagem física de estoque às cegas
 */
export async function submitBlindCount(
  utilizadorId: number,
  input: BlindCountInput
): Promise<BlindCountRecord> {
  const utilizador = await db.orm.public.Utilizador.where({ id: utilizadorId }).first();
  const produtos = await db.orm.public.Produto.select(
    'id', 'codigo', 'nome', 'categoriaId', 'precoCompra', 'stockActual', 'activo'
  ).all();
  const categorias = await db.orm.public.Categoria.select('id', 'nome').all();

  const produtosMap = new Map(produtos.map((p) => [p.id, p]));
  const categoriasMap = new Map(categorias.map((c) => [c.id, c.nome]));

  const itemRecords: BlindCountItemRecord[] = [];
  let totalDivergencias = 0;
  let impactoFinanceiroTotal = 0;

  for (const item of input.itens) {
    const prod = produtosMap.get(item.produtoId);
    if (!prod) continue;

    const stockSistema = prod.stockActual;
    const divergencia = item.quantidadeFisica - stockSistema;
    const precoCompra = Number(prod.precoCompra) || 0;
    const impacto = divergencia * precoCompra;

    if (divergencia !== 0) {
      totalDivergencias++;
    }
    impactoFinanceiroTotal += impacto;

    itemRecords.push({
      produtoId: prod.id,
      produtoCodigo: prod.codigo,
      produtoNome: prod.nome,
      categoriaNome: categoriasMap.get(prod.categoriaId) ?? 'Geral',
      quantidadeFisica: item.quantidadeFisica,
      stockSistemaNoMomento: stockSistema,
      divergencia,
      precoCompraUnitario: precoCompra,
      impactoFinanceiro: Math.round(impacto * 100) / 100,
      notas: item.notas ?? null,
    });
  }

  const existing = readAllCounts();
  const nextNum = existing.length > 0 ? Math.max(...existing.map((c) => c.numero)) + 1 : 1;

  const newRecord: BlindCountRecord = {
    id: `BC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    numero: nextNum,
    dataHora: new Date().toISOString(),
    utilizadorId,
    utilizadorNome: utilizador?.nome ?? 'Atendente',
    turno: input.turno,
    status: 'SUBMETIDA',
    observacoes: input.observacoes ?? null,
    totalItensContados: itemRecords.length,
    totalDivergencias,
    impactoFinanceiroTotal: Math.round(impactoFinanceiroTotal * 100) / 100,
    itens: itemRecords,
  };

  existing.unshift(newRecord);
  saveAllCounts(existing);

  return newRecord;
}

/**
 * Consulta todas as contagens cegas registradas (para o gerente)
 */
export async function getBlindCounts(): Promise<BlindCountRecord[]> {
  return readAllCounts();
}

/**
 * Consulta contagem cega específica por ID
 */
export async function getBlindCountById(id: string): Promise<BlindCountRecord | null> {
  const counts = readAllCounts();
  return counts.find((c) => c.id === id) ?? null;
}

/**
 * Gerente homologa a contagem e ajusta o estoque no PostgreSQL
 */
export async function homologateBlindCount(id: string, adminId: number): Promise<BlindCountRecord> {
  const counts = readAllCounts();
  const index = counts.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('Contagem não encontrada.');
  }

  const count = counts[index]!;
  if (count.status === 'HOMOLOGADA') {
    throw new Error('Esta contagem já foi homologada.');
  }

  const admin = await db.orm.public.Utilizador.where({ id: adminId }).first();

  // Apply adjustments to products with divergência
  for (const item of count.itens) {
    if (item.divergencia !== 0) {
      await recordStockAdjustment(adminId, {
        produtoId: item.produtoId,
        novoStock: item.quantidadeFisica,
        motivo: `Homologação Auditoria Contagem Cega #${count.numero} (${item.divergencia > 0 ? '+' : ''}${item.divergencia} unid.)`,
      });
    }
  }

  count.status = 'HOMOLOGADA';
  count.homologadoEm = new Date().toISOString();
  count.homologadoPor = admin?.nome ?? 'Administrador';

  counts[index] = count;
  saveAllCounts(counts);

  return count;
}

/**
 * Registo de Quebra/Perda de Cozinha pelo Atendente
 */
export async function recordKitchenWaste(
  utilizadorId: number,
  input: {
    produtoId: number;
    quantidade: number;
    motivo: string;
  }
) {
  if (input.quantidade <= 0) {
    throw new Error('A quantidade de quebra deve ser maior que zero.');
  }
  if (!input.motivo || input.motivo.trim().length === 0) {
    throw new Error('O motivo da quebra é obrigatório.');
  }

  return recordStockExit(utilizadorId, {
    produtoId: input.produtoId,
    quantidade: input.quantidade,
    motivo: `Quebra de Cozinha: ${input.motivo.trim()}`,
  });
}
