'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { EmptyState, Skeleton, AlertBanner } from '@/src/components/ui/states';
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  SalesIcon,
  HistoryIcon,
  CheckCircleIcon,
  CloseIcon,
  ArrowRightIcon,
} from '@/src/components/ui/icons';

type Produto = {
  id: number;
  codigo: string;
  nome: string;
  precoVenda: string;
  stockActual: number;
  activo: boolean;
  categoria?: { id: number; nome: string };
};

type ItemCarrinho = Produto & { quantidade: number };

type ApiResult = {
  produtos?: Produto[];
  error?: string;
  venda?: { id: number; total: string };
};

export default function VendasPage() {
  const [pesquisa, setPesquisa] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [mensagemErro, setMensagemErro] = useState('');
  const [vendaConcluida, setVendaConcluida] = useState<{ id: number; total: string } | null>(null);
  const [aCarregarProdutos, setACarregarProdutos] = useState(true);
  const [aProcessar, setAProcessar] = useState(false);

  // Fetch active products with debounce
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetch(`/api/admin/produtos?search=${encodeURIComponent(pesquisa)}&estado=activo`, {
        signal: controller.signal,
      })
        .then((res) => res.json() as Promise<ApiResult>)
        .then((data) => {
          if (!ignore) {
            setProdutos(data.produtos ?? []);
            setACarregarProdutos(false);
          }
        })
        .catch((err) => {
          if (!ignore && err.name !== 'AbortError') {
            setACarregarProdutos(false);
          }
        });
    }, 150);

    return () => {
      ignore = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [pesquisa]);

  const totalArtigos = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = carrinho.reduce(
    (acc, item) => acc + Number(item.precoVenda) * item.quantidade,
    0
  );

  function adicionarAoCarrinho(produto: Produto) {
    setMensagemErro('');
    if (produto.stockActual <= 0) {
      setMensagemErro(`O produto "${produto.nome}" não possui stock disponível.`);
      return;
    }

    setCarrinho((actual) => {
      const existente = actual.find((item) => item.id === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.stockActual) {
          setMensagemErro(`Limite de stock atingido para "${produto.nome}" (${produto.stockActual} disponíveis).`);
          return actual;
        }
        return actual.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...actual, { ...produto, quantidade: 1 }];
    });
  }

  function alterarQuantidade(id: number, novaQuantidade: number) {
    setMensagemErro('');
    setCarrinho((actual) =>
      actual.map((item) => {
        if (item.id === id) {
          const qtdAjustada = Math.max(1, Math.min(novaQuantidade, item.stockActual));
          if (novaQuantidade > item.stockActual) {
            setMensagemErro(`Apenas ${item.stockActual} unidades disponíveis para "${item.nome}".`);
          }
          return { ...item, quantidade: qtdAjustada };
        }
        return item;
      })
    );
  }

  function removerDoCarrinho(id: number) {
    setMensagemErro('');
    setCarrinho((actual) => actual.filter((item) => item.id !== id));
  }

  function limparCarrinho() {
    setCarrinho([]);
    setMensagemErro('');
  }

  function iniciarNovaVenda() {
    setCarrinho([]);
    setMensagemErro('');
    setVendaConcluida(null);
  }

  async function confirmarVenda() {
    if (carrinho.length === 0) {
      setMensagemErro('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    setMensagemErro('');
    setAProcessar(true);

    try {
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itens: carrinho.map((item) => ({
            produtoId: item.id,
            quantidade: item.quantidade,
          })),
        }),
      });

      const data = (await response.json()) as ApiResult;
      setAProcessar(false);

      if (!response.ok || !data.venda) {
        setMensagemErro(data.error ?? 'Não foi possível registar a venda. Verifique os stocks.');
        return;
      }

      setVendaConcluida({
        id: data.venda.id,
        total: data.venda.total,
      });
    } catch {
      setAProcessar(false);
      setMensagemErro('Erro de comunicação com o servidor ao finalizar a venda.');
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success">PDV Operacional</Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Balcão de Atendimento</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Ponto de Venda
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Selecione produtos para adicionar ao carrinho e conclua a transação.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/vendas/historico"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <HistoryIcon size={16} />
            <span>Consultar Histórico</span>
          </Link>
        </div>
      </div>

      {/* PDV Main Layout: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Product Search & Catalog List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 bg-white shadow-xs">
            {/* Search Input Bar */}
            <div className="relative">
              <Input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por código, nome de produto..."
                leftIcon={<SearchIcon size={18} />}
                rightIcon={
                  pesquisa ? (
                    <button
                      type="button"
                      onClick={() => setPesquisa('')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <CloseIcon size={16} />
                    </button>
                  ) : null
                }
                className="text-sm py-3"
                autoFocus
              />
            </div>
          </Card>

          {/* Product Cards List */}
          {aCarregarProdutos ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : produtos.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={24} />}
              title="Nenhum produto encontrado"
              description={
                pesquisa
                  ? `Não foram encontrados produtos activos com o termo "${pesquisa}".`
                  : 'Nenhum produto activo cadastrado no sistema.'
              }
              action={
                pesquisa ? (
                  <Button variant="outline" size="sm" onClick={() => setPesquisa('')}>
                    Limpar Pesquisa
                  </Button>
                ) : null
              }
              className="bg-white"
            />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {produtos.map((produto) => {
                const noCarrinho = carrinho.find((item) => item.id === produto.id);
                const qtdNoCarrinho = noCarrinho?.quantidade ?? 0;
                const esgotado = produto.stockActual <= 0;
                const limiteAtingido = qtdNoCarrinho >= produto.stockActual;

                return (
                  <div
                    key={produto.id}
                    className={`rounded-2xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                      esgotado
                        ? 'border-slate-200 bg-slate-50/70 opacity-60'
                        : noCarrinho
                        ? 'border-emerald-500/80 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                          {produto.codigo}
                        </span>
                        <p className="text-sm font-black text-emerald-700">
                          {Number(produto.precoVenda).toFixed(2)} MT
                        </p>
                      </div>

                      <h3 className="mt-2 text-sm font-bold text-slate-900 line-clamp-2">
                        {produto.nome}
                      </h3>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Stock disponível:</span>
                        {esgotado ? (
                          <Badge variant="danger" className="text-[10px]">Esgotado</Badge>
                        ) : produto.stockActual <= 5 ? (
                          <Badge variant="warning" className="text-[10px]">{produto.stockActual} unid.</Badge>
                        ) : (
                          <span className="font-bold text-slate-700">{produto.stockActual} unid.</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Button
                        type="button"
                        variant={noCarrinho ? 'primary' : 'outline'}
                        size="sm"
                        disabled={esgotado || limiteAtingido}
                        onClick={() => adicionarAoCarrinho(produto)}
                        className="w-full text-xs"
                        leftIcon={<PlusIcon size={14} />}
                      >
                        {esgotado
                          ? 'Sem Stock'
                          : limiteAtingido
                          ? 'Stock no Carrinho'
                          : noCarrinho
                          ? `Adicionar Mais (+1)`
                          : 'Adicionar ao Carrinho'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Cart Panel & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="sticky top-20 bg-white shadow-sm border-slate-200">
            <CardHeader className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <SalesIcon size={20} className="text-emerald-700" />
                <CardTitle className="text-base">Carrinho de Venda</CardTitle>
                <Badge variant={carrinho.length > 0 ? 'success' : 'neutral'}>
                  {totalArtigos} {totalArtigos === 1 ? 'item' : 'itens'}
                </Badge>
              </div>
              {carrinho.length > 0 && (
                <button
                  type="button"
                  onClick={limparCarrinho}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                >
                  Limpar
                </button>
              )}
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Error Banner */}
              {mensagemErro && (
                <AlertBanner
                  type="error"
                  message={mensagemErro}
                  onClose={() => setMensagemErro('')}
                />
              )}

              {/* Cart Items List */}
              {carrinho.length === 0 ? (
                <EmptyState
                  icon={<SalesIcon size={24} />}
                  title="Carrinho vazio"
                  description="Clique nos produtos à esquerda para adicionar itens à venda."
                  className="border-none py-10"
                />
              ) : (
                <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                  {carrinho.map((item) => {
                    const itemSubtotal = Number(item.precoVenda) * item.quantidade;
                    return (
                      <div key={item.id} className="pt-3 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.nome}</p>
                            <p className="text-[11px] text-slate-500">
                              {Number(item.precoVenda).toFixed(2)} MT / un.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerDoCarrinho(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Remover produto"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          {/* Stepper Controls */}
                          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                              disabled={item.quantidade <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 transition"
                            >
                              <MinusIcon size={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                              disabled={item.quantidade >= item.stockActual}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 transition"
                            >
                              <PlusIcon size={14} />
                            </button>
                          </div>

                          {/* Line Subtotal */}
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900">
                              {itemSubtotal.toFixed(2)} MT
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total & Checkout Breakdown */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Quantidade total de produtos</span>
                  <span className="font-semibold text-slate-700">{totalArtigos}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 text-slate-900">
                  <span className="text-base font-extrabold">Total a Pagar</span>
                  <span className="text-2xl font-black text-emerald-700">
                    {totalValor.toFixed(2)} MT
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={carrinho.length === 0 || aProcessar}
                isLoading={aProcessar}
                onClick={confirmarVenda}
                className="w-full font-bold shadow-md shadow-emerald-950/20"
                rightIcon={<ArrowRightIcon size={18} />}
              >
                {aProcessar ? 'A Registar Venda...' : `Concluir Venda (${totalValor.toFixed(2)} MT)`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sale Completed Success Modal / Overlay */}
      {vendaConcluida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs mb-4">
              <CheckCircleIcon size={36} />
            </div>

            <Badge variant="success" className="mb-2">Venda Concluída</Badge>
            <h2 className="text-2xl font-black text-slate-900">Venda #{vendaConcluida.id}</h2>
            <p className="mt-1 text-xs text-slate-500">
              A transacção foi registada com sucesso e o stock foi decrementado transaccionalmente.
            </p>

            <div className="my-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Valor Total Facturado</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">
                {Number(vendaConcluida.total).toFixed(2)} MT
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/app/vendas/${vendaConcluida.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Ver Comprovativo
              </Link>
              <Button
                type="button"
                variant="primary"
                onClick={iniciarNovaVenda}
                className="text-xs font-bold"
                leftIcon={<PlusIcon size={14} />}
              >
                Nova Venda
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
