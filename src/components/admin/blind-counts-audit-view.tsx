'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { EmptyState, Skeleton } from '@/src/components/ui/states';
import { useToast } from '@/src/components/ui/toast';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  UserIcon,
} from '@/src/components/ui/icons';
import type { BlindCountRecord } from '@/src/lib/blind-count';

export function BlindCountsAuditView() {
  const toast = useToast();
  const [contagens, setContagens] = useState<BlindCountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contagemAbertaId, setContagemAbertaId] = useState<string | null>(null);
  const [homologandoId, setHomologandoId] = useState<string | null>(null);

  const fetchContagens = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contagem-cega');
      const data = await res.json();
      const list: BlindCountRecord[] = data.contagens ?? [];
      setContagens(list);
      setContagemAbertaId((prev) => (prev ? prev : list.length > 0 ? list[0].id : null));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/admin/contagem-cega')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const list: BlindCountRecord[] = data.contagens ?? [];
        setContagens(list);
        if (list.length > 0) {
          setContagemAbertaId((prev) => prev ?? list[0].id);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleHomologar = async (id: string, numero: number) => {
    if (!confirm(`Deseja homologar a Contagem #${numero}? Os saldos de stock no sistema serão ajustados com base nas divergências físicas.`)) {
      return;
    }

    setHomologandoId(id);
    try {
      const res = await fetch('/api/admin/contagem-cega', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      setHomologandoId(null);

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao homologar contagem.');
        return;
      }

      toast.success(`Contagem #${numero} homologada com sucesso! Stocks actualizados.`);
      setIsLoading(true);
      fetchContagens();
    } catch {
      setHomologandoId(null);
      toast.error('Erro de conexão ao homologar contagem.');
    }
  };

  const pendentes = contagens.filter((c) => c.status === 'SUBMETIDA').length;
  const totalDivergenciasGeral = contagens.reduce((acc, c) => acc + c.totalDivergencias, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Contagens</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ClockIcon size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{contagens.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Inventários físicos submetidos</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pendentes de Homologação</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangleIcon size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{pendentes}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Requerem inspeção do gerente</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Divergências Detectadas</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
              <AlertTriangleIcon size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-700">{totalDivergenciasGeral}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Desvios de estoque identificados</p>
        </Card>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : contagens.length === 0 ? (
        <EmptyState
          icon={<CheckCircleIcon size={32} className="text-slate-300" />}
          title="Nenhuma contagem cega registada"
          description="Os atendentes podem submeter contagens físicas de fecho de turno diretamente pelo painel operacional."
          className="bg-white border-slate-200 py-12"
        />
      ) : (
        <div className="space-y-4">
          {contagens.map((contagem) => {
            const isAberta = contagemAbertaId === contagem.id;
            const isPendente = contagem.status === 'SUBMETIDA';
            const dataFmt = new Date(contagem.dataHora).toLocaleString('pt-PT');

            return (
              <Card
                key={contagem.id}
                className={`overflow-hidden border transition-all duration-150 ${
                  isAberta ? 'border-cyan-500/80 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setContagemAbertaId(isAberta ? null : contagem.id)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 cursor-pointer bg-slate-50/60 select-none hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black text-sm shrink-0 ${
                        isPendente
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      #{contagem.numero}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Contagem Cega #{contagem.numero} • Turno {contagem.turno}
                        </h3>
                        <Badge variant={isPendente ? 'warning' : 'success'}>
                          {isPendente ? 'Pendente de Homologação' : 'Homologada & Sincronizada'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <UserIcon size={12} />
                          {contagem.utilizadorNome}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon size={12} />
                          {dataFmt}
                        </span>
                        {contagem.observacoes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600 truncate max-w-xs">
                              &ldquo;{contagem.observacoes}&rdquo;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Divergências</p>
                      <p
                        className={`text-sm font-black ${
                          contagem.totalDivergencias > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {contagem.totalDivergencias === 0
                          ? '100% em Conformidade'
                          : `${contagem.totalDivergencias} produto(s) com desvio`}
                      </p>
                    </div>

                    <span className="text-xs text-slate-400 font-bold">
                      {isAberta ? 'Recolher ▲' : 'Ver Detalhes ▼'}
                    </span>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isAberta && (
                  <div className="p-5 border-t border-slate-200 bg-white space-y-4">
                    {/* Action Bar for Pending Counts */}
                    {isPendente && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangleIcon size={18} className="text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 leading-snug">
                              Inspeção de Auditoria de Turno
                            </p>
                            <p className="text-[11px] text-amber-800">
                              Ao homologar, o sistema ajusta automaticamente o stock actual de todos os produtos com divergência.
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={homologandoId === contagem.id}
                          isLoading={homologandoId === contagem.id}
                          onClick={() => handleHomologar(contagem.id, contagem.numero)}
                          className="text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shrink-0"
                          rightIcon={<CheckCircleIcon size={14} />}
                        >
                          Homologar e Sincronizar Stock
                        </Button>
                      </div>
                    )}

                    {/* Table of items */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Código</th>
                            <th className="px-4 py-2.5">Artigo</th>
                            <th className="px-4 py-2.5 text-center">Físico Contado</th>
                            <th className="px-4 py-2.5 text-center">Saldo no Sistema</th>
                            <th className="px-4 py-2.5 text-center">Divergência (Desvio)</th>
                            <th className="px-4 py-2.5 text-right">Custo Unitário</th>
                            <th className="px-4 py-2.5 text-right">Impacto Financeiro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {contagem.itens.map((item) => {
                            const isDivergente = item.divergencia !== 0;
                            return (
                              <tr
                                key={item.produtoId}
                                className={
                                   isDivergente
                                    ? item.divergencia < 0
                                      ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                      : 'bg-cyan-50/40 hover:bg-cyan-50/70'
                                    : 'hover:bg-slate-50/60'
                                }
                              >
                                <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-slate-600">
                                  {item.produtoCodigo}
                                </td>
                                <td className="px-4 py-2.5 font-bold text-slate-900">
                                  {item.produtoNome}
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {item.categoriaNome}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center font-black text-slate-900 text-sm">
                                  {item.quantidadeFisica}
                                </td>
                                <td className="px-4 py-2.5 text-center font-semibold text-slate-600">
                                  {item.stockSistemaNoMomento}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {item.divergencia === 0 ? (
                                    <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                      Conforme (0)
                                    </span>
                                  ) : item.divergencia < 0 ? (
                                    <span className="inline-flex rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800">
                                      Falta ({item.divergencia} unid.)
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-800">
                                      Sobra (+{item.divergencia} unid.)
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-medium text-slate-600">
                                  {item.precoCompraUnitario.toFixed(2)} MT
                                </td>
                                <td
                                  className={`px-4 py-2.5 text-right font-black ${
                                    item.impactoFinanceiro < 0
                                      ? 'text-rose-700'
                                      : item.impactoFinanceiro > 0
                                      ? 'text-cyan-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {item.impactoFinanceiro.toFixed(2)} MT
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-slate-600 uppercase text-[10px]">
                              Total de Artigos Contados: {contagem.totalItensContados}
                            </td>
                            <td className="px-4 py-3 text-center text-xs">
                              {contagem.totalDivergencias} divergência(s)
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600 text-[11px]">
                              Impacto Líquido:
                            </td>
                            <td
                              className={`px-4 py-3 text-right text-sm font-black ${
                                contagem.impactoFinanceiroTotal < 0
                                  ? 'text-rose-700'
                                  : contagem.impactoFinanceiroTotal > 0
                                  ? 'text-cyan-700'
                                  : 'text-slate-800'
                              }`}
                            >
                              {contagem.impactoFinanceiroTotal.toFixed(2)} MT
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
