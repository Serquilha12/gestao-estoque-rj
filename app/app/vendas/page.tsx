'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
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
  HistoryIcon,
  CloseIcon,
  ClockIcon,
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

type OrderType = 'Balcão' | 'Take Away' | 'Mesa';

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
  const [tipoPedido, setTipoPedido] = useState<OrderType>('Balcão');
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

  // Global Keyboard Shortcuts (F2: Search, F4: Checkout, Esc: Clear)
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

  function adicionarAoCarrinho(produto: Produto, qtdToAdd = 1) {
    setMensagemErro('');
    if (produto.stockActual <= 0) {
      toast.warning(`"${produto.nome}" está esgotado.`);
      return;
    }

    setCarrinho((actual) => {
      const existente = actual.find((item) => item.id === produto.id);
      if (existente) {
        const novaQtd = existente.quantidade + qtdToAdd;
        if (novaQtd > produto.stockActual) {
          toast.warning(`Limite de stock atingido (${produto.stockActual} disponíveis).`);
          return actual;
        }
        toast.info(`+${qtdToAdd} ${produto.nome}`);
        return actual.map((item) =>
          item.id === produto.id ? { ...item, quantidade: novaQtd } : item
        );
      }
      toast.success(`${produto.nome} adicionado ao carrinho.`);
      return [...actual, { ...produto, quantidade: qtdToAdd }];
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
            observacoes: `${tipoPedido ? `[${tipoPedido}] ` : ''}${checkoutData.observacoes || ''}`.trim(),
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

        setCheckoutModalAberto(false);
        setReciboData(receipt);
        setReciboModalAberto(true);
        toast.success(`Venda #${data.venda.id} registada com sucesso!`, 'Venda Concluída');

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
    [carrinho, totalValor, tipoPedido, toast]
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
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      {/* ========================================================================= */}
      {/* COLUNA CENTRAL: CATÁLOGO DE PRODUTOS (LAYOUT REF 2 - CORES REF 1)         */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Top Header / Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#121824] border border-black/5 dark:border-white/10 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Caixa Aberto
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#121824] border border-black/5 dark:border-white/10 px-3 py-1.5 rounded-full shadow-2xs">
              <ClockIcon size={13} className="text-zinc-500" />
              {horaAtual || '00:00:00'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuebraModalAberto(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition shadow-2xs cursor-pointer"
            >
              <AlertTriangleIcon size={14} className="text-amber-500" />
              <span>Registar Quebra</span>
            </button>

            <button
              type="button"
              onClick={() => setContagemModalAberto(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition shadow-2xs cursor-pointer"
            >
              <span>Contagem de Turno</span>
            </button>

            <Link
              href="/app/vendas/historico"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition shadow-2xs"
            >
              <HistoryIcon size={14} />
              <span>Histórico</span>
            </Link>
          </div>
        </div>

        {/* Search Bar (Ref 2 Style with Capsule Shape) */}
        <div className="relative flex items-center">
          <div className="absolute left-4.5 text-zinc-600 dark:text-zinc-400 pointer-events-none">
            <SearchIcon size={18} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por código ou nome (pressione F2 para focar)..."
            className="w-full pl-12 pr-28 py-3.5 rounded-full bg-white dark:bg-[#121824] border border-black/5 dark:border-white/10 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white shadow-xs transition"
            autoFocus
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {pesquisa && (
              <button
                type="button"
                onClick={() => {
                  setPesquisa('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                <CloseIcon size={16} />
              </button>
            )}
            <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 bg-[#F4F5F7] dark:bg-[#1A202C] rounded-full border border-black/5 dark:border-white/5">
              F2
            </span>
          </div>
        </div>

        {/* Horizontal Category Chips (Ref 2 Layout + Ref 1 Colors) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoriaAtiva(null)}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
              categoriaAtiva === null
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'bg-white dark:bg-[#121824] text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/10 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Todos os Produtos
          </button>

          {aCarregarCategorias ? (
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-9 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          ) : (
            categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
                  categoriaAtiva === cat.id
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-white dark:bg-[#121824] text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/10 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {cat.nome}
              </button>
            ))
          )}
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Cardápio & Produtos
          </h2>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos disponíveis'}
          </span>
        </div>

        {/* Error Notification */}
        {mensagemErro && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex justify-between items-center">
            <span>{mensagemErro}</span>
            <button type="button" onClick={() => setMensagemErro('')} className="p-1">
              <CloseIcon size={14} />
            </button>
          </div>
        )}

        {/* Product Cards Grid (Ref 2 Layout + Ref 1 Aesthetics) */}
        {aCarregarProdutos ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-5 space-y-4 animate-pulse"
              >
                <div className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-md" />
                <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-700 rounded-md" />
              </div>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F5F7] dark:bg-[#1A202C] text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <SearchIcon size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {pesquisa
                ? `Não foram encontrados produtos com "${pesquisa}".`
                : 'Não existem produtos activos registados nesta categoria.'}
            </p>
            {(pesquisa || categoriaAtiva !== null) && (
              <button
                type="button"
                onClick={() => {
                  setPesquisa('');
                  setCategoriaAtiva(null);
                }}
                className="mt-4 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto) => {
              const noCarrinho = carrinho.find((item) => item.id === produto.id);
              const qtdNoCarrinho = noCarrinho?.quantidade ?? 0;
              const esgotado = produto.stockActual <= 0;
              const limiteAtingido = qtdNoCarrinho >= produto.stockActual;

              return (
                <div
                  key={produto.id}
                  className={`group rounded-3xl border p-5 transition-all duration-200 flex flex-col justify-between select-none ${
                    esgotado
                      ? 'border-black/5 dark:border-white/5 bg-zinc-100/60 dark:bg-zinc-900/40 opacity-50 cursor-not-allowed'
                      : noCarrinho
                      ? 'border-black/20 dark:border-white/30 bg-white dark:bg-[#121824] shadow-md ring-1 ring-black/10 dark:ring-white/10'
                      : 'border-black/5 dark:border-white/10 bg-white dark:bg-[#121824] hover:shadow-lg hover:border-black/10 dark:hover:border-white/20'
                  }`}
                >
                  {/* Top: Placeholder Image or Category Thumbnail */}
                  <div className="h-28 w-full rounded-2xl bg-[#F8F9FA] dark:bg-[#1A202C] flex items-center justify-center text-4xl mb-4 text-zinc-400 transition group-hover:scale-[1.02]">
                    📦
                  </div>

                  {/* Body: Title & Price */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                        {produto.nome}
                      </h3>
                      <span className="text-sm font-black text-zinc-900 dark:text-white whitespace-nowrap">
                        {Number(produto.precoVenda).toFixed(2)} MT
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                        Cód: {produto.codigo}
                      </span>
                      {esgotado ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          Esgotado
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          {produto.stockActual} unid.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action / Stepper */}
                  <div className="mt-5 pt-3.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                    {noCarrinho ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1 bg-[#F4F5F7] dark:bg-[#1A202C] rounded-full p-1 border border-black/5 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              if (noCarrinho.quantidade <= 1) {
                                removerDoCarrinho(produto.id);
                              } else {
                                alterarQuantidade(produto.id, noCarrinho.quantidade - 1);
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition text-xs font-bold cursor-pointer"
                          >
                            <MinusIcon size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-zinc-900 dark:text-white">
                            {noCarrinho.quantidade}
                          </span>
                          <button
                            type="button"
                            disabled={limiteAtingido}
                            onClick={() => alterarQuantidade(produto.id, noCarrinho.quantidade + 1)}
                            className="w-6 h-6 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30 transition text-xs font-bold cursor-pointer"
                          >
                            <PlusIcon size={12} />
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          No Pedido
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={esgotado}
                        onClick={() => adicionarAoCarrinho(produto)}
                        className="w-full py-2.5 px-4 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-semibold text-xs tracking-wide transition shadow-xs disabled:opacity-40 cursor-pointer"
                      >
                        {esgotado ? 'Indisponível' : 'Adicionar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COLUNA LATERAL: CARRINHO / TICKET (LAYOUT REF 2 - PURR'COFFEE)             */}
      {/* ========================================================================= */}
      <div className="w-full xl:w-96 shrink-0">
        <div className="sticky top-20 rounded-3xl bg-white dark:bg-[#121824] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-6 transition-colors duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Comanda
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {totalArtigos} {totalArtigos === 1 ? 'item adicionado' : 'itens adicionados'}
              </p>
            </div>

            {carrinho.length > 0 && (
              <button
                type="button"
                onClick={limparCarrinho}
                className="text-xs font-semibold text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Order Mode Switcher (Purr'Coffee Layout) */}
          <div className="p-1 rounded-full bg-[#F4F5F7] dark:bg-[#1A202C] border border-black/5 dark:border-white/5 flex gap-1">
            {(['Balcão', 'Take Away', 'Mesa'] as OrderType[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTipoPedido(mode)}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  tipoPedido === mode
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
            {carrinho.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                <span className="text-3xl block mb-2">🛒</span>
                <p className="text-xs font-medium">Nenhum item selecionado</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Clique nos produtos ao lado para adicionar
                </p>
              </div>
            ) : (
              carrinho.map((item) => {
                const itemSubtotal = Number(item.precoVenda) * item.quantidade;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A202C] border border-black/5 dark:border-white/5 space-y-2.5 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {item.nome}
                        </p>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          {Number(item.precoVenda).toFixed(2)} MT / un.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerDoCarrinho(item.id)}
                        className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Remover"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Stepper */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 rounded-full p-0.5 border border-black/5 dark:border-white/10 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantidade <= 1) {
                              removerDoCarrinho(item.id);
                            } else {
                              alterarQuantidade(item.id, item.quantidade - 1);
                            }
                          }}
                          className="w-5 h-5 rounded-full text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition text-[10px] font-bold cursor-pointer"
                        >
                          <MinusIcon size={10} />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-zinc-900 dark:text-white">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantidade >= item.stockActual}
                          onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                          className="w-5 h-5 rounded-full text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30 transition text-[10px] font-bold cursor-pointer"
                        >
                          <PlusIcon size={10} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleNotas(item.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                            item.notas
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                          }`}
                        >
                          {item.notas ? 'Obs ✓' : '+ Obs'}
                        </button>
                        <span className="text-xs font-black text-zinc-900 dark:text-white">
                          {itemSubtotal.toFixed(2)} MT
                        </span>
                      </div>
                    </div>

                    {/* Note Input */}
                    {item.mostrandoNotas && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={item.notas ?? ''}
                          onChange={(e) => atualizarNota(item.id, e.target.value)}
                          placeholder="Ex: sem açúcar, bem passado..."
                          className="w-full text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Summary */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
            <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Artigos Selecionados</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{totalArtigos} unid.</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Modalidade</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{tipoPedido}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Total a Pagar
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {totalValor.toFixed(2)} <span className="text-xs font-bold">MT</span>
              </span>
            </div>
          </div>

          {/* Large Action Button (Ref 2 Purr'Coffee + Ref 1 Black Capsule) */}
          <button
            type="button"
            disabled={carrinho.length === 0 || aProcessar}
            onClick={abrirCheckout}
            className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98] font-bold text-sm tracking-wide shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Finalizar Venda</span>
            <span className="text-xs opacity-60 font-normal">[F4]</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAIS: CHECKOUT, RECIBO, QUEBRA E CONTAGEM CEGA                          */}
      {/* ========================================================================= */}
      <CheckoutModal
        isOpen={checkoutModalAberto}
        total={totalValor}
        quantidadeItens={totalArtigos}
        isProcessing={aProcessar}
        onClose={() => setCheckoutModalAberto(false)}
        onConfirm={handleConfirmarVenda}
      />

      {reciboData && (
        <ReceiptModal
          receipt={reciboData}
          isOpen={reciboModalAberto}
          onClose={() => setReciboModalAberto(false)}
          onNewSale={resetarParaNovaVenda}
        />
      )}

      <KitchenWasteModal
        isOpen={quebraModalAberto}
        onClose={() => setQuebraModalAberto(false)}
        onSuccess={() => {
          setPesquisa((p) => p + ' ');
          setTimeout(() => setPesquisa((p) => p.trim()), 50);
        }}
      />

      <BlindCountModal
        isOpen={contagemModalAberto}
        onClose={() => setContagemModalAberto(false)}
      />
    </div>
  );
}
