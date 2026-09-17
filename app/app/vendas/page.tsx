'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { EmptyState, Skeleton, AlertBanner } from '@/src/components/ui/states';
import { useToast } from '@/src/components/ui/toast';
import { CheckoutModal, type CheckoutPayload } from '@/src/components/sales/checkout-modal';
import { ReceiptModal, type ReceiptData } from '@/src/components/sales/receipt-modal';
import { KitchenWasteModal } from '@/src/components/operations/kitchen-waste-modal';
import { BlindCountModal } from '@/src/components/operations/blind-count-modal';
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  SalesIcon,
  HistoryIcon,
  CloseIcon,
  ArrowRightIcon,
  ClockIcon,
  NoteIcon,
  AlertTriangleIcon,
} from '@/src/components/ui/icons';

type Produto = {
  id: number;
  codigo: string;
  nome: string;
  precoVenda: string;
  stockActual: number;
  activo: boolean;
  categoriaId?: number;
  categoria?: { id: number; nome: string };
};

type Categoria = {
  id: number;
  nome: string;
  descricao?: string | null;
  activo: boolean;
};

type ItemCarrinho = Produto & {
  quantidade: number;
  notas?: string;
  mostrandoNotas?: boolean;
};

type ApiSaleResponse = {
  ok?: boolean;
  venda?: {
    id: number;
    total: string;
    metodoPagamento?: string;
    valorRecebido?: number;
    troco?: number;
    referenciaPagamento?: string;
    observacoes?: string;
    itens?: Array<{
      produtoId: number;
      quantidade: number;
      precoUnitario: string;
      subtotal: string;
    }>;
  };
  error?: string;
};

export default function VendasPage() {
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [pesquisa, setPesquisa] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [mensagemErro, setMensagemErro] = useState('');
  const [aCarregarProdutos, setACarregarProdutos] = useState(true);
  const [aCarregarCategorias, setACarregarCategorias] = useState(true);
  const [aProcessar, setAProcessar] = useState(false);

  // Modals
  const [checkoutModalAberto, setCheckoutModalAberto] = useState(false);
  const [reciboModalAberto, setReciboModalAberto] = useState(false);
  const [reciboData, setReciboData] = useState<ReceiptData | null>(null);
  const [quebraModalAberto, setQuebraModalAberto] = useState(false);
  const [contagemModalAberto, setContagemModalAberto] = useState(false);

  // Realtime clock
  const [horaAtual, setHoraAtual] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHoraAtual(
        now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active categories
  useEffect(() => {
    fetch('/api/admin/categorias?estado=activo')
      .then((res) => res.json())
      .then((data) => {
        setCategorias(data.categorias ?? []);
        setACarregarCategorias(false);
      })
      .catch(() => {
        setACarregarCategorias(false);
      });
  }, []);

  // Fetch active products with debounce
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setACarregarProdutos(true);
      let url = `/api/admin/produtos?search=${encodeURIComponent(pesquisa)}&estado=activo`;
      if (categoriaAtiva !== null) {
        url += `&categoriaId=${categoriaAtiva}`;
      }

      fetch(url, { signal: controller.signal })
        .then((res) => res.json())
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
    }, 120);

    return () => {
      ignore = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [pesquisa, categoriaAtiva]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (carrinho.length > 0 && !checkoutModalAberto && !reciboModalAberto) {
          setCheckoutModalAberto(true);
        }
      } else if (e.key === 'Escape') {
        if (!checkoutModalAberto && !reciboModalAberto && pesquisa) {
          e.preventDefault();
          setPesquisa('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho.length, checkoutModalAberto, reciboModalAberto, pesquisa]);

  // Cart Calculations
  const totalArtigos = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = carrinho.reduce(
    (acc, item) => acc + Number(item.precoVenda) * item.quantidade,
    0
  );

  // Cart actions
  function adicionarAoCarrinho(produto: Produto) {
    setMensagemErro('');
    if (produto.stockActual <= 0) {
      toast.warning(`"${produto.nome}" está esgotado.`);
      return;
    }

    setCarrinho((actual) => {
      const existente = actual.find((item) => item.id === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.stockActual) {
          toast.warning(`Limite de stock atingido (${produto.stockActual} disponíveis).`);
          return actual;
        }
        toast.info(`+1 ${produto.nome} (${existente.quantidade + 1} no carrinho)`);
        return actual.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      toast.success(`${produto.nome} adicionado ao carrinho.`);
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
            toast.warning(`Limite de stock atingido para "${item.nome}".`);
          }
          return { ...item, quantidade: qtdAjustada };
        }
        return item;
      })
    );
  }

  function toggleNotas(id: number) {
    setCarrinho((actual) =>
      actual.map((item) =>
        item.id === id ? { ...item, mostrandoNotas: !item.mostrandoNotas } : item
      )
    );
  }

  function atualizarNota(id: number, nota: string) {
    setCarrinho((actual) =>
      actual.map((item) => (item.id === id ? { ...item, notas: nota } : item))
    );
  }

  function removerDoCarrinho(id: number) {
    setMensagemErro('');
    setCarrinho((actual) => actual.filter((item) => item.id !== id));
    toast.info('Item removido do carrinho.');
  }

  function limparCarrinho() {
    if (carrinho.length === 0) return;
    setCarrinho([]);
    setMensagemErro('');
    toast.info('Carrinho esvaziado.');
  }

  function abrirCheckout() {
    if (carrinho.length === 0) {
      setMensagemErro('Adicione pelo menos um produto ao carrinho antes de finalizar.');
      toast.warning('Adicione produtos ao carrinho.');
      return;
    }
    setMensagemErro('');
    setCheckoutModalAberto(true);
  }

  const handleConfirmarVenda = useCallback(
    async (checkoutData: CheckoutPayload) => {
      setAProcessar(true);
      setMensagemErro('');

      try {
        const response = await fetch('/api/vendas', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            itens: carrinho.map((item) => ({
              produtoId: item.id,
              quantidade: item.quantidade,
              notas: item.notas || undefined,
            })),
            metodoPagamento: checkoutData.metodoPagamento,
            valorRecebido: checkoutData.valorRecebido,
            troco: checkoutData.troco,
            referenciaPagamento: checkoutData.referenciaPagamento,
            observacoes: checkoutData.observacoes,
          }),
        });

        const data = (await response.json()) as ApiSaleResponse;
        setAProcessar(false);

        if (!response.ok || !data.venda) {
          const err = data.error ?? 'Não foi possível registar a venda.';
          setMensagemErro(err);
          toast.error(err, 'Erro ao Finalizar Venda');
          return;
        }

        // Prepare receipt data
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('pt-PT')} ${now.toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

        const receipt: ReceiptData = {
          id: data.venda.id,
          dataHora: formattedDate,
          metodoPagamento: checkoutData.metodoPagamento,
          valorRecebido: checkoutData.valorRecebido,
          troco: checkoutData.troco,
          referenciaPagamento: checkoutData.referenciaPagamento,
          total: totalValor,
          itens: carrinho.map((item) => ({
            id: item.id,
            nome: item.nome,
            quantidade: item.quantidade,
            precoVenda: item.precoVenda,
            notas: item.notas,
          })),
        };

        // Close checkout and open receipt
        setCheckoutModalAberto(false);
        setReciboData(receipt);
        setReciboModalAberto(true);

        toast.success(`Venda #${data.venda.id} registada com sucesso!`, 'Venda Concluída');

        // Optimistically update stock in catalog view
        setProdutos((prev) =>
          prev.map((prod) => {
            const noCarrinho = carrinho.find((c) => c.id === prod.id);
            if (noCarrinho) {
              return {
                ...prod,
                stockActual: Math.max(0, prod.stockActual - noCarrinho.quantidade),
              };
            }
            return prod;
          })
        );
      } catch {
        setAProcessar(false);
        const err = 'Erro de comunicação ao processar a venda.';
        setMensagemErro(err);
        toast.error(err);
      }
    },
    [carrinho, totalValor, toast]
  );

  function resetarParaNovaVenda() {
    setCarrinho([]);
    setMensagemErro('');
    setReciboModalAberto(false);
    setReciboData(null);
    setPesquisa('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header / Cashier Status Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Caixa Aberto • Balcão Activo
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
              <ClockIcon size={14} className="text-slate-500" />
              {horaAtual || '00:00:00'}
            </span>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Ponto de Venda & Balcão
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Take Away Rui Júnior • Registo rápido de pedidos e emissão de talões
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuebraModalAberto(true)}
            className="text-xs font-bold gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
            leftIcon={<AlertTriangleIcon size={14} className="text-amber-600" />}
          >
            Registar Quebra
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setContagemModalAberto(true)}
            className="text-xs font-bold gap-1.5 border-cyan-300 text-cyan-800 hover:bg-cyan-50"
          >
            Contagem de Turno
          </Button>

          <Link
            href="/app/vendas/historico"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
          >
            <HistoryIcon size={16} />
            <span>Histórico</span>
          </Link>
        </div>
      </div>

      {/* PDV Main Layout: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Product Search & Catalog List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar & Categories Tabs */}
          <Card className="p-4 bg-white shadow-xs space-y-3.5 border-slate-200">
            {/* Search Input Bar */}
            <div className="relative">
              <Input
                ref={searchInputRef}
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por código ou nome (pressione F2 para focar)..."
                leftIcon={<SearchIcon size={18} />}
                rightIcon={
                  pesquisa ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPesquisa('');
                        searchInputRef.current?.focus();
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <CloseIcon size={16} />
                    </button>
                  ) : null
                }
                className="text-sm py-3 bg-slate-50/70 border-slate-200 focus:bg-white"
                autoFocus
              />
            </div>

            {/* Category Pills Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setCategoriaAtiva(null)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 shrink-0 ${
                  categoriaAtiva === null
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos os Produtos
              </button>

              {aCarregarCategorias ? (
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20 rounded-xl" />
                  <Skeleton className="h-7 w-24 rounded-xl" />
                </div>
              ) : (
                categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaAtiva(cat.id)}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 shrink-0 ${
                      categoriaAtiva === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.nome}
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Product Cards Grid */}
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
              title="Nenhum produto disponível"
              description={
                pesquisa
                  ? `Não foram encontrados produtos activos correspondentes a "${pesquisa}".`
                  : 'Nenhum produto activo nesta categoria.'
              }
              action={
                pesquisa || categoriaAtiva !== null ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPesquisa('');
                      setCategoriaAtiva(null);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                ) : null
              }
              className="bg-white border-slate-200"
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
                    onClick={() => {
                      if (!esgotado && !limiteAtingido) {
                        adicionarAoCarrinho(produto);
                      }
                    }}
                    className={`group relative rounded-2xl border p-4 transition-all duration-150 flex flex-col justify-between cursor-pointer select-none ${
                      esgotado
                        ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                        : noCarrinho
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Code and Price */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                          {produto.codigo}
                        </span>

                        <div className="text-right">
                          <p className="text-base font-black text-emerald-700">
                            {Number(produto.precoVenda).toFixed(2)}{' '}
                            <span className="text-[10px] font-bold">MT</span>
                          </p>
                        </div>
                      </div>

                      <h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition line-clamp-2">
                        {produto.nome}
                      </h3>

                      {/* Stock availability indicator */}
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">Disponibilidade:</span>
                        {esgotado ? (
                          <Badge variant="danger" className="text-[10px] font-bold">
                            Esgotado
                          </Badge>
                        ) : produto.stockActual <= 5 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Apenas {produto.stockActual} unid.
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-700">
                            {produto.stockActual} unid.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {noCarrinho ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                            {qtdNoCarrinho} no carrinho
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 group-hover:underline">
                            + Adicionar mais
                          </span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={esgotado}
                          onClick={(e) => {
                            e.stopPropagation();
                            adicionarAoCarrinho(produto);
                          }}
                          className="w-full text-xs font-bold"
                          leftIcon={<PlusIcon size={14} />}
                        >
                          {esgotado ? 'Sem Stock' : 'Adicionar ao Pedido'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Cart Panel & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="sticky top-20 bg-white shadow-sm border-slate-200 rounded-3xl overflow-hidden">
            <CardHeader className="flex items-center justify-between pb-3.5 border-b border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <SalesIcon size={18} />
                </span>
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900">
                    Carrinho do Balcão
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {totalArtigos} {totalArtigos === 1 ? 'artigo adicionado' : 'artigos adicionados'}
                  </p>
                </div>
              </div>

              {carrinho.length > 0 && (
                <button
                  type="button"
                  onClick={limparCarrinho}
                  className="rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                >
                  Limpar
                </button>
              )}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
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
                  icon={<SalesIcon size={28} className="text-slate-300" />}
                  title="Carrinho vazio"
                  description="Selecione produtos na lista ao lado ou busque por código para iniciar o pedido."
                  className="border-none py-12"
                />
              ) : (
                <div className="max-h-[380px] overflow-y-auto space-y-3.5 pr-1 divide-y divide-slate-100">
                  {carrinho.map((item) => {
                    const itemSubtotal = Number(item.precoVenda) * item.quantidade;
                    return (
                      <div key={item.id} className="pt-3.5 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-slate-900 leading-snug truncate">
                              {item.nome}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {Number(item.precoVenda).toFixed(2)} MT / un.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerDoCarrinho(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition"
                            title="Remover produto"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>

                        {/* Quantity Stepper & Subtotal */}
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                              disabled={item.quantidade <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 transition"
                              title="Diminuir"
                            >
                              <MinusIcon size={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-900">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                              disabled={item.quantidade >= item.stockActual}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 transition"
                              title="Aumentar"
                            >
                              <PlusIcon size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleNotas(item.id)}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                                item.notas
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                              title="Observação de preparo na cozinha"
                            >
                              <NoteIcon size={12} />
                              <span>{item.notas ? 'Com Obs' : '+ Obs'}</span>
                            </button>

                            <span className="text-xs font-black text-slate-900">
                              {itemSubtotal.toFixed(2)} MT
                            </span>
                          </div>
                        </div>

                        {/* Optional Kitchen Note Input */}
                        {item.mostrandoNotas && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={item.notas ?? ''}
                              onChange={(e) => atualizarNota(item.id, e.target.value)}
                              placeholder="Obs de preparo (ex: sem cebola, bem passado)..."
                              className="w-full text-[11px] rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total & Checkout Breakdown */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Quantidade de artigos</span>
                  <span className="font-bold text-slate-800">{totalArtigos} unid.</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 text-slate-900">
                  <span className="text-sm font-extrabold uppercase tracking-wider text-slate-600">
                    Total a Cobrar
                  </span>
                  <span className="text-3xl font-black text-emerald-700">
                    {totalValor.toFixed(2)} <span className="text-sm font-bold">MT</span>
                  </span>
                </div>
              </div>

              {/* Finalize Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={carrinho.length === 0 || aProcessar}
                onClick={abrirCheckout}
                className="w-full font-black py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-950/20 text-sm tracking-wide"
                rightIcon={<ArrowRightIcon size={18} />}
              >
                Finalizar Venda (F4)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalAberto}
        total={totalValor}
        quantidadeItens={totalArtigos}
        isProcessing={aProcessar}
        onClose={() => setCheckoutModalAberto(false)}
        onConfirm={handleConfirmarVenda}
      />

      {/* Thermal Receipt Modal */}
      {reciboData && (
        <ReceiptModal
          receipt={reciboData}
          isOpen={reciboModalAberto}
          onClose={() => setReciboModalAberto(false)}
          onNewSale={resetarParaNovaVenda}
        />
      )}

      {/* Kitchen Waste Modal */}
      <KitchenWasteModal
        isOpen={quebraModalAberto}
        onClose={() => setQuebraModalAberto(false)}
        onSuccess={() => {
          // Re-fetch products to reflect updated stock
          setPesquisa((p) => p + ' ');
          setTimeout(() => setPesquisa((p) => p.trim()), 50);
        }}
      />

      {/* Blind Count Modal */}
      <BlindCountModal
        isOpen={contagemModalAberto}
        onClose={() => setContagemModalAberto(false)}
      />
    </main>
  );
}
