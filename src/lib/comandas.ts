import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
import { recordStockExit, recordStockEntry } from '@/src/lib/stock';

export interface ComandaItem {
  id: string;
  produtoId: number;
  codigo: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  notas?: string | null;
  adicionadoEm: string;
}

export interface Comanda {
  id: string;
  numero: number;
  numeroMesa?: string | null;
  nomeCliente?: string | null;
  utilizadorId: number;
  utilizadorNome: string;
  status: 'ABERTA' | 'FINALIZADA' | 'CANCELADA';
  itens: ComandaItem[];
  total: number;
  criadoEm: string;
  actualizadoEm: string;
  finalizadoEm?: string | null;
  canceladoEm?: string | null;
  metodoPagamento?: string | null;
  valorRecebido?: number | null;
  troco?: number | null;
  referenciaPagamento?: string | null;
  vendaId?: number | null;
  observacoes?: string | null;
}

export interface NovaComandaInput {
  numeroMesa?: string | null;
  nomeCliente?: string | null;
  observacoes?: string | null;
  itens: Array<{
    produtoId: number;
    quantidade: number;
    notas?: string | null;
  }>;
}

const BASE_DIR = process.env.VERCEL ? os.tmpdir() : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'comandas.json');

let inMemoryComandas: Comanda[] = [];

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch {
    // Falha silenciosa em ambientes restritos
  }
}

function readAllComandas(): Comanda[] {
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Comanda[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback para memória
  }
  return inMemoryComandas;
}

function saveAllComandas(comandas: Comanda[]) {
  inMemoryComandas = comandas;
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(comandas, null, 2), 'utf-8');
  } catch {
    // Mantém em memória
  }
}

/**
 * Abre uma nova comanda / mesa com pagamento posterior.
 * Deduz o stock IMEDIATAMENTE para evitar venda dupla no balcão.
 */
export async function createComanda(
  utilizadorId: number,
  input: NovaComandaInput
): Promise<Comanda> {
  if (!input.itens || input.itens.length === 0) {
    throw new Error('A comanda deve conter pelo menos um produto.');
  }

  // 1. Obter utilizador
  let utilizadorNome = 'Atendente';
  try {
    const u = await db.orm.public.Utilizador.where({ id: utilizadorId }).first();
    if (u) utilizadorNome = u.nome;
  } catch {
    try {
      const { data } = await supabaseAdmin
        .from('Utilizador')
        .select('nome')
        .eq('id', utilizadorId)
        .maybeSingle();
      if (data) utilizadorNome = data.nome;
    } catch {
      // Ignora
    }
  }

  // 2. Obter catálogo de produtos
  let produtos: any[] = [];
  try {
    produtos = await db.orm.public.Produto.where({ activo: true }).all();
  } catch {
    try {
      const { data } = await supabaseAdmin.from('Produto').select('*').eq('activo', true);
      produtos = data ?? [];
    } catch {
      produtos = [];
    }
  }

  const produtosMap = new Map(produtos.map((p) => [Number(p.id), p]));

  // 3. Validar e preparar itens calculando subtotais
  const itensCalculados: ComandaItem[] = [];
  let totalComanda = 0;

  for (const item of input.itens) {
    const prod = produtosMap.get(item.produtoId);
    if (!prod) {
      throw new Error(`Produto #${item.produtoId} não encontrado ou inactivo.`);
    }
    const currentStock = Number(prod.stockActual) || 0;
    if (currentStock < item.quantidade) {
      throw new Error(
        `Stock insuficiente para "${prod.nome}". Disponível: ${currentStock}, Solicitado: ${item.quantidade}`
      );
    }

    const precoUnitario = Number(prod.precoVenda) || 0;
    const subtotal = Math.round(precoUnitario * item.quantidade * 100) / 100;
    totalComanda += subtotal;

    itensCalculados.push({
      id: `ITEM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      produtoId: prod.id,
      codigo: prod.codigo,
      nome: prod.nome,
      quantidade: item.quantidade,
      precoUnitario,
      subtotal,
      notas: item.notas?.trim() || null,
      adicionadoEm: new Date().toISOString(),
    });
  }

  const existing = readAllComandas();
  const nextNum = existing.length > 0 ? Math.max(...existing.map((c) => c.numero)) + 1 : 1;
  const comandaId = `CMD-${Date.now()}-${nextNum}`;
  const identificador = input.numeroMesa
    ? `Mesa ${input.numeroMesa}`
    : input.nomeCliente
    ? `Cliente ${input.nomeCliente}`
    : `Comanda #${nextNum}`;

  // 4. Deduzir o stock de cada item imediatamente
  for (const item of itensCalculados) {
    await recordStockExit(utilizadorId, {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      motivo: `Lançamento em Aberto: ${identificador}`,
    });
  }

  const novaComanda: Comanda = {
    id: comandaId,
    numero: nextNum,
    numeroMesa: input.numeroMesa?.trim() || null,
    nomeCliente: input.nomeCliente?.trim() || null,
    utilizadorId,
    utilizadorNome,
    status: 'ABERTA',
    itens: itensCalculados,
    total: Math.round(totalComanda * 100) / 100,
    criadoEm: new Date().toISOString(),
    actualizadoEm: new Date().toISOString(),
    observacoes: input.observacoes?.trim() || null,
  };

  existing.unshift(novaComanda);
  saveAllComandas(existing);

  return novaComanda;
}

/**
 * Adiciona novos itens a uma comanda aberta existente.
 * Deduz o stock imediatamente para os novos itens.
 */
export async function addItemToComanda(
  comandaId: string,
  utilizadorId: number,
  novosItens: Array<{ produtoId: number; quantidade: number; notas?: string | null }>
): Promise<Comanda> {
  const comandas = readAllComandas();
  const index = comandas.findIndex((c) => c.id === comandaId);
  if (index === -1) {
    throw new Error('Comanda não encontrada.');
  }

  const comanda = comandas[index]!;
  if (comanda.status !== 'ABERTA') {
    throw new Error(`A comanda está com status "${comanda.status}" e não pode receber mais itens.`);
  }

  // Obter catálogo de produtos
  let produtos: any[] = [];
  try {
    produtos = await db.orm.public.Produto.where({ activo: true }).all();
  } catch {
    try {
      const { data } = await supabaseAdmin.from('Produto').select('*').eq('activo', true);
      produtos = data ?? [];
    } catch {
      produtos = [];
    }
  }
  const produtosMap = new Map(produtos.map((p) => [Number(p.id), p]));

  const identificador = comanda.numeroMesa
    ? `Mesa ${comanda.numeroMesa}`
    : comanda.nomeCliente
    ? `Cliente ${comanda.nomeCliente}`
    : `Comanda #${comanda.numero}`;

  for (const item of novosItens) {
    const prod = produtosMap.get(item.produtoId);
    if (!prod) {
      throw new Error(`Produto #${item.produtoId} não encontrado ou inactivo.`);
    }
    const currentStock = Number(prod.stockActual) || 0;
    if (currentStock < item.quantidade) {
      throw new Error(
        `Stock insuficiente para "${prod.nome}". Disponível: ${currentStock}, Solicitado: ${item.quantidade}`
      );
    }

    // Deduz stock imediatamente
    await recordStockExit(utilizadorId, {
      produtoId: prod.id,
      quantidade: item.quantidade,
      motivo: `Adição à comanda em aberto: ${identificador}`,
    });

    const precoUnitario = Number(prod.precoVenda) || 0;
    const subtotal = Math.round(precoUnitario * item.quantidade * 100) / 100;

    comanda.itens.push({
      id: `ITEM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      produtoId: prod.id,
      codigo: prod.codigo,
      nome: prod.nome,
      quantidade: item.quantidade,
      precoUnitario,
      subtotal,
      notas: item.notas?.trim() || null,
      adicionadoEm: new Date().toISOString(),
    });
  }

  comanda.total = Math.round(
    comanda.itens.reduce((acc, it) => acc + it.subtotal, 0) * 100
  ) / 100;
  comanda.actualizadoEm = new Date().toISOString();

  comandas[index] = comanda;
  saveAllComandas(comandas);

  return comanda;
}

/**
 * Consulta comandas filtrando por status (ex: apenas ABERTA)
 */
export async function getComandas(status?: 'ABERTA' | 'FINALIZADA' | 'CANCELADA'): Promise<Comanda[]> {
  const comandas = readAllComandas();
  if (status) {
    return comandas.filter((c) => c.status === status);
  }
  return comandas;
}

/**
 * Consulta uma comanda específica por ID
 */
export async function getComandaById(id: string): Promise<Comanda | null> {
  const comandas = readAllComandas();
  return comandas.find((c) => c.id === id) ?? null;
}

/**
 * Liquida / fecha uma comanda em aberto com pagamento.
 * Regista a Venda oficial no PostgreSQL para auditoria fiscal e relatórios financeiros,
 * SEM deduzir o stock novamente (pois o stock já foi deduzido no consumo).
 */
export async function settleComanda(
  comandaId: string,
  utilizadorId: number,
  pagamento: {
    metodoPagamento: string;
    valorRecebido?: number;
    troco?: number;
    referenciaPagamento?: string | null;
  }
): Promise<{ comanda: Comanda; vendaId: number }> {
  const comandas = readAllComandas();
  const index = comandas.findIndex((c) => c.id === comandaId);
  if (index === -1) {
    throw new Error('Comanda não encontrada.');
  }

  const comanda = comandas[index]!;
  if (comanda.status !== 'ABERTA') {
    throw new Error(`Esta comanda já está "${comanda.status}".`);
  }

  const total = comanda.total;
  let vendaId: number;

  // 1. Criar registo oficial de Venda e ItemVenda
  try {
    const novaVenda = await db.transaction(async (tx) => {
      const v = await tx.orm.public.Venda.create({
        utilizadorId,
        total: total.toFixed(2),
      });

      for (const item of comanda.itens) {
        await tx.orm.public.ItemVenda.create({
          vendaId: v.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario.toFixed(2),
          subtotal: item.subtotal.toFixed(2),
        });
      }
      return v;
    });
    vendaId = novaVenda.id;
  } catch {
    // 2. Fallback Supabase REST
    const { data: v, error: vErr } = await supabaseAdmin
      .from('Venda')
      .insert({
        utilizadorId,
        total: total.toFixed(2),
      })
      .select()
      .single();

    if (vErr || !v) {
      throw new Error(vErr?.message || 'Falha ao registar encerramento de venda.');
    }
    vendaId = Number(v.id);

    for (const item of comanda.itens) {
      await supabaseAdmin.from('ItemVenda').insert({
        vendaId,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
      });
    }
  }

  // 3. Atualizar status da comanda
  comanda.status = 'FINALIZADA';
  comanda.finalizadoEm = new Date().toISOString();
  comanda.actualizadoEm = new Date().toISOString();
  comanda.metodoPagamento = pagamento.metodoPagamento;
  comanda.valorRecebido = pagamento.valorRecebido ?? null;
  comanda.troco = pagamento.troco ?? null;
  comanda.referenciaPagamento = pagamento.referenciaPagamento ?? null;
  comanda.vendaId = vendaId;

  comandas[index] = comanda;
  saveAllComandas(comandas);

  return { comanda, vendaId };
}

/**
 * Cancela uma comanda em aberto.
 * Devolve os produtos ao stock através de MovimentoStock (ENTRADA).
 */
export async function cancelComanda(
  comandaId: string,
  utilizadorId: number,
  motivo?: string
): Promise<Comanda> {
  const comandas = readAllComandas();
  const index = comandas.findIndex((c) => c.id === comandaId);
  if (index === -1) {
    throw new Error('Comanda não encontrada.');
  }

  const comanda = comandas[index]!;
  if (comanda.status !== 'ABERTA') {
    throw new Error(`Esta comanda já está "${comanda.status}".`);
  }

  const identificador = comanda.numeroMesa
    ? `Mesa ${comanda.numeroMesa}`
    : comanda.nomeCliente
    ? `Cliente ${comanda.nomeCliente}`
    : `Comanda #${comanda.numero}`;

  // Devolver cada produto ao inventário
  for (const item of comanda.itens) {
    await recordStockEntry(utilizadorId, {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      motivo: `Cancelamento de Comanda (${identificador}): ${motivo || 'Cancelado pelo cliente'}`,
    });
  }

  comanda.status = 'CANCELADA';
  comanda.canceladoEm = new Date().toISOString();
  comanda.actualizadoEm = new Date().toISOString();
  comanda.observacoes = motivo
    ? `${comanda.observacoes ? comanda.observacoes + ' | ' : ''}Cancelamento: ${motivo}`
    : comanda.observacoes;

  comandas[index] = comanda;
  saveAllComandas(comandas);

  return comanda;
}
