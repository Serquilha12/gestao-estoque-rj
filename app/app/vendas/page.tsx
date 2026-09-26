'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/src/components/ui/toast';
import { CheckoutModal, type CheckoutPayload } from '@/src/components/sales/checkout-modal';
import { ReceiptModal, type ReceiptData } from '@/src/components/sales/receipt-modal';
import { KitchenWasteModal } from '@/src/components/operations/kitchen-waste-modal';
import { BlindCountModal } from '@/src/components/operations/blind-count-modal';
import { formatTimeMaputo, formatDateTimeMaputo, getRelativeTimeMaputo } from '@/src/lib/date';
import type { Comanda } from '@/src/lib/comandas';
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  HistoryIcon,
  CloseIcon,
  ClockIcon,
  AlertTriangleIcon,
  TableIcon,
  RefreshIcon,
  CheckCircleIcon,
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

export default function VendasPage() {
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tab view: 'catalogo' vs 'comandas'
  const [abaAtiva, setAbaAtiva] = useState<'catalogo' | 'comandas'>('catalogo');

  // State
  const [pesquisa, setPesquisa] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);

  // Filtro instantâneo em memória: 0ms de delay ao digitar ou clicar em categorias
  const produtos = useMemo(() => {
    let lista = todosProdutos;
    if (categoriaAtiva !== null) {
      lista = lista.filter((p) => p.categoriaId === categoriaAtiva);
    }
    if (pesquisa.trim()) {
      const q = pesquisa.trim().toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [todosProdutos, categoriaAtiva, pesquisa]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [tipoPedido, setTipoPedido] = useState<OrderType>('Balcão');
  const [mensagemErro, setMensagemErro] = useState('');
  const [aCarregarProdutos, setACarregarProdutos] = useState(true);
  const [aCarregarCategorias, setACarregarCategorias] = useState(true);
  const [aProcessar, setAProcessar] = useState(false);

  // Comandas em Aberto State
  const [comandasAbertas, setComandasAbertas] = useState<Comanda[]>([]);
  const [aCarregarComandas, setACarregarComandas] = useState(false);
  const [abrirComandaModalAberto, setAbrirComandaModalAberto] = useState(false);
  const [mesaInput, setMesaInput] = useState('');
  const [clienteInput, setClienteInput] = useState('');
  const [observacoesComandaInput, setObservacoesComandaInput] = useState('');
  const [comandaParaLiquidar, setComandaParaLiquidar] = useState<Comanda | null>(null);
  const [comandaParaAdicionarItens, setComandaParaAdicionarItens] = useState<Comanda | null>(null);

  // Offline & PWA State
  const [isOnline, setIsOnline] = useState(true);

  // Modals
  const [checkoutModalAberto, setCheckoutModalAberto] = useState(false);
  const [reciboModalAberto, setReciboModalAberto] = useState(false);
  const [reciboData, setReciboData] = useState<ReceiptData | null>(null);
  const [quebraModalAberto, setQuebraModalAberto] = useState(false);
  const [contagemModalAberto, setContagemModalAberto] = useState(false);
  const [carrinhoDrawerAberto, setCarrinhoDrawerAberto] = useState(false);

  // Realtime clock (Mozambique Africa/Maputo UTC+2)
  const [horaAtual, setHoraAtual] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setHoraAtual(formatTimeMaputo(new Date(), true));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor Online/Offline Status and Background Sync
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão à internet restabelecida!', 'Online');
      sincronizarVendasOffline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        'Sem ligação à internet. O sistema continuará a funcionar no modo offline.',
        'Modo Offline'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Sincronizar vendas gravadas offline quando a rede voltar
  const sincronizarVendasOffline = useCallback(async () => {
    try {
      const queueRaw = localStorage.getItem('tk_offline_sales_queue');
      if (!queueRaw) return;
      const queue = JSON.parse(queueRaw) as any[];
      if (!Array.isArray(queue) || queue.length === 0) return;

      toast.info(`A sincronizar ${queue.length} venda(s) offline pendente(s)...`);
      const restantes: any[] = [];

      for (const item of queue) {
        try {
          const res = await fetch('/api/vendas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          if (!res.ok) {
            restantes.push(item);
          }
        } catch {
          restantes.push(item);
        }
      }

      if (restantes.length === 0) {
        localStorage.removeItem('tk_offline_sales_queue');
        toast.success('Todas as vendas offline foram sincronizadas com sucesso!');
      } else {
        localStorage.setItem('tk_offline_sales_queue', JSON.stringify(restantes));
      }
    } catch {
      // Ignora erro
    }
  }, [toast]);

  // Carregamento inicial em lote e paralelo do catálogo (0ms debounce)
  const carregarCatalogo = useCallback(async () => {
    setACarregarProdutos(true);
    setACarregarCategorias(true);

    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/admin/categorias?estado=activo'),
        fetch('/api/admin/produtos?estado=activo'),
      ]);

      const [catData, prodData] = await Promise.all([
        catRes.json().catch(() => ({})),
        prodRes.json().catch(() => ({})),
      ]);

      setCategorias(catData.categorias ?? []);
      setTodosProdutos(prodData.produtos ?? []);
    } catch {
      setCategorias([]);
      setTodosProdutos([]);
    } finally {
      setACarregarCategorias(false);
      setACarregarProdutos(false);
    }
  }, []);

  useEffect(() => {
    carregarCatalogo();
  }, [carregarCatalogo]);

  // Fetch open comandas
  const carregarComandas = useCallback(() => {
    setACarregarComandas(true);
    fetch('/api/comandas?status=ABERTA')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.comandas)) {
          setComandasAbertas(data.comandas);
        }
        setACarregarComandas(false);
      })
      .catch(() => {
        setACarregarComandas(false);
      });
  }, []);

  useEffect(() => {
    carregarComandas();
    // Atualiza a cada 30 segundos
    const interval = setInterval(carregarComandas, 30000);
    return () => clearInterval(interval);
  }, [carregarComandas]);

  // Cart operations
  function adicionarAoCarrinho(produto: Produto) {
    if (produto.stockActual <= 0) return;

    setCarrinho((prev) => {
      const index = prev.findIndex((item) => item.id === produto.id);
      if (index >= 0) {
        if (prev[index]!.quantidade >= produto.stockActual) return prev;
        const novo = [...prev];
        novo[index] = {
          ...novo[index]!,
          quantidade: novo[index]!.quantidade + 1,
        };
        return novo;
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }

  function alterarQuantidade(produtoId: number, novaQuantidade: number) {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }

    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.id === produtoId) {
          const quantidadeFinal = Math.min(novaQuantidade, item.stockActual);
          return { ...item, quantidade: quantidadeFinal };
        }
        return item;
      })
    );
  }

  function removerDoCarrinho(produtoId: number) {
    setCarrinho((prev) => prev.filter((item) => item.id !== produtoId));
  }

  function limparCarrinho() {
    setCarrinho([]);
    setComandaParaAdicionarItens(null);
  }

  function atualizarNota(produtoId: number, nota: string) {
    setCarrinho((prev) =>
      prev.map((item) => (item.id === produtoId ? { ...item, notas: nota } : item))
    );
  }

  function toggleNotas(produtoId: number) {
    setCarrinho((prev) =>
      prev.map((item) =>
        item.id === produtoId ? { ...item, mostrandoNotas: !item.mostrandoNotas } : item
      )
    );
  }

  const totalValor = carrinho.reduce(
    (acc, item) => acc + Number(item.precoVenda) * item.quantidade,
    0
  );

  const totalArtigos = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // Keyboard Shortcuts: F2 (Abrir Comanda), F4 (Finalizar Venda direta), ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        if (carrinho.length > 0 && !checkoutModalAberto && !reciboModalAberto) {
          abrirCheckout();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (carrinho.length > 0 && !abrirComandaModalAberto) {
          setAbrirComandaModalAberto(true);
        }
      } else if (e.key === 'Escape') {
        if (reciboModalAberto) {
          resetarParaNovaVenda();
        } else if (checkoutModalAberto) {
          setCheckoutModalAberto(false);
        } else if (abrirComandaModalAberto) {
          setAbrirComandaModalAberto(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho.length, checkoutModalAberto, reciboModalAberto, abrirComandaModalAberto]);

  function abrirCheckout() {
    if (carrinho.length === 0) return;
    setMensagemErro('');
    setCheckoutModalAberto(true);
  }

  // Finalizar Venda Direta ou Liquidar Comanda
  const handleConfirmarVenda = useCallback(
    async (checkoutData: CheckoutPayload) => {
      setAProcessar(true);
      setMensagemErro('');

      // CASO A: Liquidando uma comanda aberta existente
      if (comandaParaLiquidar) {
        try {
          const res = await fetch(`/api/comandas/${comandaParaLiquidar.id}/liquidar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metodoPagamento: checkoutData.metodoPagamento,
              valorRecebido: checkoutData.valorRecebido,
              troco: checkoutData.troco,
              referenciaPagamento: checkoutData.referenciaPagamento,
            }),
          });

          const data = await res.json();
          setAProcessar(false);

          if (!res.ok || !data.ok) {
            const err = data.error || 'Erro ao liquidar comanda.';
            setMensagemErro(err);
            toast.error(err, 'Erro na Liquidação');
            return;
          }

          const receipt: ReceiptData = {
            id: data.vendaId,
            dataHora: formatDateTimeMaputo(new Date()),
            numeroMesa: comandaParaLiquidar.numeroMesa ?? undefined,
            clienteNome: comandaParaLiquidar.nomeCliente ?? undefined,
            metodoPagamento: checkoutData.metodoPagamento,
            valorRecebido: checkoutData.valorRecebido,
            troco: checkoutData.troco,
            referenciaPagamento: checkoutData.referenciaPagamento,
            total: comandaParaLiquidar.total,
            itens: comandaParaLiquidar.itens.map((item) => ({
              id: item.produtoId,
              nome: item.nome,
              quantidade: item.quantidade,
              precoVenda: item.precoUnitario,
              notas: item.notas ?? undefined,
            })),
          };

          setCheckoutModalAberto(false);
          setComandaParaLiquidar(null);
          setReciboData(receipt);
          setReciboModalAberto(true);
          toast.success(
            `Comanda #${comandaParaLiquidar.numero} liquidada com sucesso! Venda #${data.vendaId} gerada.`,
            'Conta Encerrada'
          );
          carregarComandas();
          return;
        } catch {
          setAProcessar(false);
          const err = 'Erro de comunicação ao liquidar a comanda.';
          setMensagemErro(err);
          toast.error(err);
          return;
        }
      }

      // CASO B: Venda Direta ao Balcão
      const payload = {
        itens: carrinho.map((item) => ({
          produtoId: item.id,
          quantidade: item.quantidade,
          notas: item.notas,
        })),
        metodoPagamento: checkoutData.metodoPagamento,
        valorRecebido: checkoutData.valorRecebido,
        troco: checkoutData.troco,
        referenciaPagamento: checkoutData.referenciaPagamento,
        observacoes: `Modalidade: ${tipoPedido}`,
      };

      // Se estiver offline, salva na fila local do PWA
      if (!navigator.onLine) {
        setAProcessar(false);
        const offlineId = Date.now();
        const offlineQueue = JSON.parse(
          localStorage.getItem('tk_offline_sales_queue') || '[]'
        );
        offlineQueue.push({ id: offlineId, payload, criadoEm: new Date().toISOString() });
        localStorage.setItem('tk_offline_sales_queue', JSON.stringify(offlineQueue));

        const receipt: ReceiptData = {
          id: offlineId,
          dataHora: `${formatDateTimeMaputo(new Date())} (Offline)`,
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
        toast.warning(
          'Venda registada localmente no modo offline. Será sincronizada assim que a rede voltar.',
          'Gravado Offline'
        );

        // Atualizar estoque na tela local
        setTodosProdutos((prev) =>
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
        return;
      }

      // Se estiver online, processa normalmente via API
      try {
        const response = await fetch('/api/vendas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        setAProcessar(false);

        if (!response.ok || !data.ok) {
          const err = data.error || 'Erro ao processar venda no servidor.';
          setMensagemErro(err);
          toast.error(err, 'Erro ao Finalizar Venda');
          return;
        }

        const receipt: ReceiptData = {
          id: data.venda.id,
          dataHora: formatDateTimeMaputo(new Date()),
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

        // Atualizar estoque local
        setTodosProdutos((prev) =>
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
    [carrinho, totalValor, tipoPedido, comandaParaLiquidar, toast, carregarComandas]
  );

  // Abertura ou Adição de Itens a uma Comanda / Mesa em Aberto
  async function handleConfirmarAberturaComanda() {
    if (carrinho.length === 0) return;
    setAProcessar(true);

    // Se estiver adicionando itens a comanda existente
    if (comandaParaAdicionarItens) {
      try {
        const res = await fetch(`/api/comandas/${comandaParaAdicionarItens.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'adicionar_itens',
            itens: carrinho.map((i) => ({
              produtoId: i.id,
              quantidade: i.quantidade,
              notas: i.notas,
            })),
          }),
        });

        const data = await res.json();
        setAProcessar(false);

        if (!res.ok || !data.ok) {
          toast.error(data.error || 'Erro ao adicionar itens à comanda.');
          return;
        }

        // Deduzir localmente no estado de produtos
        setTodosProdutos((prev) =>
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

        toast.success(
          `Itens adicionados à comanda #${comandaParaAdicionarItens.numero} com sucesso!`,
          'Pedido Actualizado'
        );
        limparCarrinho();
        setAbrirComandaModalAberto(false);
        setAbaAtiva('comandas');
        carregarComandas();
        return;
      } catch {
        setAProcessar(false);
        toast.error('Erro de rede ao adicionar itens à comanda.');
        return;
      }
    }

    // Criar nova comanda em aberto
    try {
      const res = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroMesa: mesaInput.trim() || null,
          nomeCliente: clienteInput.trim() || null,
          observacoes: observacoesComandaInput.trim() || null,
          itens: carrinho.map((i) => ({
            produtoId: i.id,
            quantidade: i.quantidade,
            notas: i.notas,
          })),
        }),
      });

      const data = await res.json();
      setAProcessar(false);

      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Erro ao abrir comanda.');
        return;
      }

      // Deduzir localmente no estado de produtos
      setTodosProdutos((prev) =>
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

      const identificador = mesaInput
        ? `Mesa ${mesaInput}`
        : clienteInput
        ? `Cliente ${clienteInput}`
        : `Comanda #${data.comanda.numero}`;

      toast.success(
        `${identificador} aberta com sucesso! Stock reservado e deduzido imediatamente.`,
        'Comanda Criada'
      );

      limparCarrinho();
      setMesaInput('');
      setClienteInput('');
      setObservacoesComandaInput('');
      setAbrirComandaModalAberto(false);
      setAbaAtiva('comandas');
      carregarComandas();
    } catch {
      setAProcessar(false);
      toast.error('Erro de conexão ao abrir comanda.');
    }
  }

  // Cancelar uma comanda aberta (devolve ao stock)
  async function handleCancelarComanda(comanda: Comanda) {
    const confirmou = window.confirm(
      `Deseja realmente cancelar a Comanda #${comanda.numero} (${comanda.numeroMesa || 'Balcão'})? Os produtos serão devolvidos imediatamente ao stock.`
    );
    if (!confirmou) return;

    try {
      const res = await fetch(`/api/comandas/${comanda.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelar', motivo: 'Cancelado pelo atendente no PDV' }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Erro ao cancelar comanda.');
        return;
      }

      toast.success(
        `Comanda #${comanda.numero} cancelada com sucesso! Produtos devolvidos ao inventário.`,
        'Comanda Cancelada'
      );
      carregarComandas();

      // Recarrega produtos para sincronizar o stock devolvido
      const params = new URLSearchParams({ estado: 'activo' });
      fetch(`/api/admin/produtos?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => setTodosProdutos(d.produtos ?? []));
    } catch {
      toast.error('Erro ao cancelar comanda.');
    }
  }

  function resetarParaNovaVenda() {
    setCarrinho([]);
    setComandaParaLiquidar(null);
    setComandaParaAdicionarItens(null);
    setMensagemErro('');
    setReciboModalAberto(false);
    setReciboData(null);
    setPesquisa('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }

  const renderComanda = (isDrawer = false) => (
    <div className={`flex flex-col h-full space-y-4 ${isDrawer ? 'p-5 sm:p-6' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900">
              Comanda Actual
            </h3>
            {comandaParaAdicionarItens && (
              <span className="rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5">
                +{comandaParaAdicionarItens.numeroMesa || `#${comandaParaAdicionarItens.numero}`}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600">
            {totalArtigos} {totalArtigos === 1 ? 'item adicionado' : 'itens adicionados'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {carrinho.length > 0 && (
            <button
              type="button"
              onClick={limparCarrinho}
              className="text-xs font-semibold text-zinc-400 hover:text-rose-600 transition cursor-pointer"
            >
              Limpar
            </button>
          )}
          {isDrawer && (
            <button
              type="button"
              onClick={() => setCarrinhoDrawerAberto(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
            >
              <CloseIcon size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Banner se estiver adicionando itens a uma comanda existente */}
      {comandaParaAdicionarItens && (
        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex justify-between items-center">
          <div>
            <span className="font-bold">A Adicionar à Comanda:</span>{' '}
            {comandaParaAdicionarItens.numeroMesa || `CMD #${comandaParaAdicionarItens.numero}`}
            {comandaParaAdicionarItens.nomeCliente ? ` (${comandaParaAdicionarItens.nomeCliente})` : ''}
          </div>
          <button
            type="button"
            onClick={() => setComandaParaAdicionarItens(null)}
            className="text-indigo-600 hover:text-indigo-900 font-bold underline text-[11px]"
          >
            Sair
          </button>
        </div>
      )}

      {/* Order Mode Switcher */}
      <div className="p-1 rounded-full bg-[#F4F5F7] border border-black/5 flex gap-1">
        {(['Balcão', 'Take Away', 'Mesa'] as OrderType[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTipoPedido(mode)}
            className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              tipoPedido === mode
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 space-y-3 max-h-[340px] xl:max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
        {carrinho.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <div className="w-12 h-12 rounded-full bg-[#F4F5F7] flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <SearchIcon size={20} />
            </div>
            <p className="text-xs font-semibold text-zinc-600">Carrinho vazio</p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] mx-auto">
              Clique nos produtos do catálogo para adicionar a este pedido.
            </p>
          </div>
        ) : (
          carrinho.map((item) => {
            const itemSubtotal = Number(item.precoVenda) * item.quantidade;
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-black/5 space-y-2 hover:border-black/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">{item.nome}</h4>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {Number(item.precoVenda).toFixed(2)} MT / un
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerDoCarrinho(item.id)}
                    className="text-zinc-400 hover:text-rose-600 transition p-1 cursor-pointer"
                    title="Remover"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Stepper */}
                  <div className="flex items-center gap-1 bg-white rounded-full p-0.5 border border-black/5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantidade <= 1) {
                          removerDoCarrinho(item.id);
                        } else {
                          alterarQuantidade(item.id, item.quantidade - 1);
                        }
                      }}
                      className="w-5 h-5 rounded-full text-zinc-700 flex items-center justify-center hover:bg-black hover:text-white transition text-[10px] font-bold cursor-pointer"
                    >
                      <MinusIcon size={10} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-zinc-900">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantidade >= item.stockActual}
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="w-5 h-5 rounded-full text-zinc-700 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition text-[10px] font-bold cursor-pointer"
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
                          ? 'bg-amber-100 text-amber-900'
                          : 'text-zinc-400 hover:text-zinc-700'
                      }`}
                    >
                      {item.notas ? 'Obs ✓' : '+ Obs'}
                    </button>
                    <span className="text-xs font-black text-zinc-900">
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
                      className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-1.5 text-zinc-900 outline-none focus:ring-1 focus:ring-black"
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
      <div className="pt-3 border-t border-black/5 space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-600">
          <span>Artigos Selecionados</span>
          <span className="font-semibold text-zinc-900">{totalArtigos} unid.</span>
        </div>
        <div className="flex justify-between text-xs text-zinc-600">
          <span>Modalidade</span>
          <span className="font-semibold text-zinc-900">{tipoPedido}</span>
        </div>

        <div className="flex justify-between items-baseline pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Total a Pagar
          </span>
          <span className="text-2xl font-black text-zinc-900 tracking-tight">
            {totalValor.toFixed(2)} <span className="text-xs font-bold">MT</span>
          </span>
        </div>
      </div>

      {/* Dual Action Buttons: Finalizar Venda Imediata OU Lançar em Aberto na Mesa/Comanda */}
      <div className="space-y-2 pt-1">
        {comandaParaAdicionarItens ? (
          <button
            type="button"
            disabled={carrinho.length === 0 || aProcessar}
            onClick={() => handleConfirmarAberturaComanda()}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] font-bold text-sm tracking-wide shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Confirmar Novos Itens</span>
            <span className="text-xs opacity-75 font-normal">
              ({comandaParaAdicionarItens.numeroMesa || `#${comandaParaAdicionarItens.numero}`})
            </span>
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={carrinho.length === 0 || aProcessar}
              onClick={() => {
                if (isDrawer) setCarrinhoDrawerAberto(false);
                setComandaParaLiquidar(null);
                abrirCheckout();
              }}
              className="w-full py-3.5 rounded-2xl bg-black text-white hover:opacity-90 active:scale-[0.98] font-bold text-sm tracking-wide shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Finalizar Venda</span>
              <span className="text-xs opacity-60 font-normal">[F4]</span>
            </button>

            <button
              type="button"
              disabled={carrinho.length === 0 || aProcessar}
              onClick={() => {
                if (isDrawer) setCarrinhoDrawerAberto(false);
                setAbrirComandaModalAberto(true);
              }}
              className="w-full py-2.5 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-50 active:scale-[0.98] font-bold text-xs tracking-wide transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <TableIcon size={15} />
              <span>Lançar na Mesa / Comanda</span>
              <span className="text-xs opacity-50 font-normal">[F2]</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative pb-24 xl:pb-0 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* ========================================================================= */}
        {/* COLUNA CENTRAL: ABAS (CATÁLOGO vs COMANDAS EM ABERTO)                     */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Header / Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-black/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs">
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isOnline ? 'Caixa Aberto (Online)' : 'Modo Offline (PWA)'}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-white border border-black/5 px-3 py-1.5 rounded-full shadow-2xs">
                <ClockIcon size={13} className="text-zinc-500" />
                <span>{horaAtual || '00:00:00'} (Maputo)</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQuebraModalAberto(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-black hover:bg-black/5 transition shadow-2xs cursor-pointer"
              >
                <AlertTriangleIcon size={13} className="text-amber-500" />
                <span>Registar Quebra</span>
              </button>

              <button
                type="button"
                onClick={() => setContagemModalAberto(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-black hover:bg-black/5 transition shadow-2xs cursor-pointer"
              >
                <span>Contagem de Turno</span>
              </button>

              <Link
                href="/app/vendas/historico"
                className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-black hover:bg-black/5 transition shadow-2xs"
              >
                <HistoryIcon size={13} />
                <span>Histórico</span>
              </Link>
            </div>
          </div>

          {/* MAIN TAB SWITCHER: CATÁLOGO vs COMANDAS & MESAS ABERTAS */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAbaAtiva('catalogo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  abaAtiva === 'catalogo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Catálogo / Balcão</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('comandas')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  abaAtiva === 'comandas'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon size={14} />
                <span>Comandas & Mesas Abertas</span>
                {comandasAbertas.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    abaAtiva === 'comandas' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {comandasAbertas.length}
                  </span>
                )}
              </button>
            </div>

            {abaAtiva === 'comandas' && (
              <button
                type="button"
                onClick={carregarComandas}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <RefreshIcon size={13} className={aCarregarComandas ? 'animate-spin' : ''} />
                <span>Actualizar</span>
              </button>
            )}
          </div>

          {/* ===================================================================== */}
          {/* CONTEÚDO DA ABA 1: CATÁLOGO DE PRODUTOS                               */}
          {/* ===================================================================== */}
          {abaAtiva === 'catalogo' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <SearchIcon
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  placeholder="Pesquisar por nome ou código do produto..."
                  className="w-full rounded-2xl border border-black/5 bg-white py-3 pl-11 pr-10 text-xs sm:text-sm text-zinc-900 shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black"
                />
                {pesquisa && (
                  <button
                    type="button"
                    onClick={() => setPesquisa('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>

              {/* Category Pills Bar */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCategoriaAtiva(null)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
                    categoriaAtiva === null
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-white text-zinc-600 border border-black/5 hover:text-zinc-900 hover:bg-black/5'
                  }`}
                >
                  Todos os Produtos
                </button>

                {aCarregarCategorias ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-20 rounded-full bg-zinc-200 animate-pulse shrink-0"
                      />
                    ))}
                  </div>
                ) : (
                  categorias.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoriaAtiva(cat.id)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
                        categoriaAtiva === cat.id
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-white text-zinc-600 border border-black/5 hover:text-zinc-900 hover:bg-black/5'
                      }`}
                    >
                      {cat.nome}
                    </button>
                  ))
                )}
              </div>

              {/* Section Title */}
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  Cardápio & Produtos
                </h2>
                <span className="text-xs font-semibold text-zinc-600">
                  {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
                </span>
              </div>

              {/* Error Notification */}
              {mensagemErro && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex justify-between items-center">
                  <span>{mensagemErro}</span>
                  <button type="button" onClick={() => setMensagemErro('')} className="p-1">
                    <CloseIcon size={14} />
                  </button>
                </div>
              )}

              {/* Product Cards Grid */}
              {aCarregarProdutos ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-3xl border border-black/5 bg-white p-5 space-y-4 animate-pulse"
                    >
                      <div className="h-28 rounded-2xl bg-zinc-100" />
                      <div className="h-4 w-3/4 bg-zinc-200 rounded-md" />
                      <div className="h-4 w-1/3 bg-zinc-200 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : produtos.length === 0 ? (
                <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F4F5F7] text-zinc-400 flex items-center justify-center mx-auto mb-3">
                    <SearchIcon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
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
                      className="mt-4 px-4 py-2 rounded-full border border-black/10 text-xs font-semibold hover:bg-black/5 transition"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {produtos.map((produto) => {
                    const noCarrinho = carrinho.find((item) => item.id === produto.id);
                    const qtdNoCarrinho = noCarrinho?.quantidade ?? 0;
                    const esgotado = produto.stockActual <= 0;
                    const limiteAtingido = qtdNoCarrinho >= produto.stockActual;

                    return (
                      <div
                        key={produto.id}
                        className={`group rounded-3xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between select-none ${
                          esgotado
                            ? 'border-black/5 bg-zinc-100/60 opacity-50 cursor-not-allowed'
                            : noCarrinho
                            ? 'border-black/20 bg-white shadow-md ring-1 ring-black/10'
                            : 'border-black/5 bg-white hover:shadow-lg hover:border-black/10'
                        }`}
                      >
                        {/* Top: Thumbnail */}
                        <div className="h-24 sm:h-28 w-full rounded-2xl bg-[#F8F9FA] flex items-center justify-center text-3xl sm:text-4xl mb-3 text-zinc-400 transition group-hover:scale-[1.02]">
                          🍱
                        </div>

                        {/* Middle: Details */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                              {produto.nome}
                            </h3>
                            <span className="text-xs font-black text-emerald-800 shrink-0">
                              {Number(produto.precoVenda).toFixed(2)} MT
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-zinc-600 font-medium">
                              Cód: {produto.codigo}
                            </span>
                            {esgotado ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                                Esgotado
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-zinc-600">
                                {produto.stockActual} unid.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action / Stepper */}
                        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                          {noCarrinho ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-1 bg-[#F4F5F7] rounded-full p-1 border border-black/5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (noCarrinho.quantidade <= 1) {
                                      removerDoCarrinho(produto.id);
                                    } else {
                                      alterarQuantidade(produto.id, noCarrinho.quantidade - 1);
                                    }
                                  }}
                                  className="w-6 h-6 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-black hover:text-white transition text-xs font-bold cursor-pointer"
                                >
                                  <MinusIcon size={12} />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-zinc-900">
                                  {noCarrinho.quantidade}
                                </span>
                                <button
                                  type="button"
                                  disabled={limiteAtingido}
                                  onClick={() =>
                                    alterarQuantidade(produto.id, noCarrinho.quantidade + 1)
                                  }
                                  className="w-6 h-6 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition text-xs font-bold cursor-pointer"
                                >
                                  <PlusIcon size={12} />
                                </button>
                              </div>

                              <span className="text-xs font-semibold text-zinc-500">
                                No Pedido
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={esgotado}
                              onClick={() => adicionarAoCarrinho(produto)}
                              className="w-full py-2 px-3 rounded-full bg-black text-white hover:opacity-90 font-semibold text-xs tracking-wide transition shadow-xs disabled:opacity-40 cursor-pointer"
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
          )}

          {/* ===================================================================== */}
          {/* CONTEÚDO DA ABA 2: COMANDAS & MESAS ABERTAS (PAGAMENTO POSTERIOR)     */}
          {/* ===================================================================== */}
          {abaAtiva === 'comandas' && (
            <div className="space-y-6">
              {/* Comandas Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Mesas & Comandas em Atendimento
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pedidos activos com consumo no local e pagamento posterior. O stock já foi deduzido.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <div className="text-left sm:text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Total Acumulado em Consumo
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      {comandasAbertas
                        .reduce((acc, c) => acc + c.total, 0)
                        .toFixed(2)}{' '}
                      MT
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Open Comandas */}
              {aCarregarComandas ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse"
                    >
                      <div className="h-6 w-1/3 bg-slate-200 rounded-md" />
                      <div className="h-16 bg-slate-100 rounded-xl" />
                      <div className="h-8 bg-slate-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : comandasAbertas.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <TableIcon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nenhuma mesa ou comanda aberta
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Não existem comandas em atendimento no momento. Adicione artigos no catálogo e clique em &quot;Lançar na Mesa / Comanda&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('catalogo')}
                    className="mt-4 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Voltar ao Catálogo
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {comandasAbertas.map((comanda) => (
                    <div
                      key={comanda.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Top Header of Comanda Card */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white px-2.5 py-1 text-xs font-black">
                              <TableIcon size={12} />
                              {comanda.numeroMesa || `Mesa Balcão`}
                            </span>
                            <span className="text-xs font-extrabold text-slate-700">
                              CMD #{comanda.numero}
                            </span>
                          </div>

                          <p className="text-xs text-slate-900 font-bold mt-1.5">
                            Cliente: {comanda.nomeCliente || 'Não identificado'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="inline-block rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            {getRelativeTimeMaputo(comanda.criadoEm)}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatTimeMaputo(comanda.criadoEm)}
                          </p>
                        </div>
                      </div>

                      {/* Items List in Comanda */}
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                        {comanda.itens.map((it) => (
                          <div
                            key={it.id}
                            className="flex justify-between items-baseline py-1 border-b border-slate-50 text-slate-700"
                          >
                            <span className="font-medium text-slate-800">
                              <span className="font-bold text-slate-900">{it.quantidade}x</span>{' '}
                              {it.nome}
                            </span>
                            <span className="font-bold text-slate-900 shrink-0">
                              {it.subtotal.toFixed(2)} MT
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Total */}
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total a Liquidar:
                        </span>
                        <span className="text-2xl font-black text-emerald-800 tracking-tight">
                          {comanda.total.toFixed(2)} MT
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                        {/* Liquidar Conta */}
                        <button
                          type="button"
                          onClick={() => {
                            setComandaParaLiquidar(comanda);
                            setCheckoutModalAberto(true);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircleIcon size={14} />
                          <span>Liquidar / Fechar Conta</span>
                        </button>

                        {/* Adicionar Mais Itens */}
                        <button
                          type="button"
                          onClick={() => {
                            setComandaParaAdicionarItens(comanda);
                            setAbaAtiva('catalogo');
                            toast.info(
                              `Modo de adição ativo para ${comanda.numeroMesa || `Comanda #${comanda.numero}`}. Selecione os produtos no catálogo.`
                            );
                          }}
                          className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <PlusIcon size={13} />
                          <span>Adicionar Itens</span>
                        </button>

                        {/* Cancelar Comanda */}
                        <button
                          type="button"
                          onClick={() => handleCancelarComanda(comanda)}
                          className="py-2.5 px-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Cancelar e Devolver Stock"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUNA LATERAL: COMANDA DESKTOP (STICKY)                                  */}
        {/* ========================================================================= */}
        <div className="hidden xl:block w-96 shrink-0">
          <div className="sticky top-20 rounded-3xl bg-white border border-black/5 shadow-sm transition-colors duration-200">
            {renderComanda(false)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA FLUTUANTE INFERIOR (MOBILE / TABLET < 1280px)                       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-black/10 p-3 sm:p-4 backdrop-blur-md shadow-2xl xl:hidden flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCarrinhoDrawerAberto(true)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white font-bold text-sm shadow-xs">
            {totalArtigos}
          </span>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Comanda ({tipoPedido})
            </span>
            <span className="block text-base font-black text-zinc-900 truncate">
              {totalValor.toFixed(2)} MT
            </span>
          </div>
        </button>

        <button
          type="button"
          disabled={carrinho.length === 0}
          onClick={abrirCheckout}
          className="px-6 py-3 rounded-full bg-black text-white font-bold text-xs tracking-wide shadow-md disabled:opacity-40 shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition"
        >
          Finalizar Venda
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER / SLIDE-OVER DA COMANDA (MOBILE / TABLET)                          */}
      {/* ========================================================================= */}
      {carrinhoDrawerAberto && (
        <div className="fixed inset-0 z-50 xl:hidden flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setCarrinhoDrawerAberto(false)}
          />
          <div className="relative ml-auto flex w-full max-w-md flex-1 flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200 h-full overflow-hidden">
            {renderComanda(true)}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ABRIR NOVA COMANDA / LANÇAR NA MESA                                */}
      {/* ========================================================================= */}
      {abrirComandaModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <TableIcon size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Lançar na Mesa / Comanda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consumo imediato com pagamento posterior
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbrirComandaModalAberto(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 transition"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Número ou Identificador da Mesa (Opcional)
                </label>
                <input
                  type="text"
                  value={mesaInput}
                  onChange={(e) => setMesaInput(e.target.value)}
                  placeholder="Ex: Mesa 04, Esplanada 2..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteInput}
                  onChange={(e) => setClienteInput(e.target.value)}
                  placeholder="Ex: Sr. Carlos, Dona Ana..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações do Atendimento (Opcional)
                </label>
                <input
                  type="text"
                  value={observacoesComandaInput}
                  onChange={(e) => setObservacoesComandaInput(e.target.value)}
                  placeholder="Ex: Pedido com garrafas adicionais..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              {/* Informação sobre o Stock */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <span className="font-bold">Aviso de Inventário:</span> Ao confirmar, o stock de{' '}
                <span className="font-bold">{totalArtigos} artigo(s)</span> no valor de{' '}
                <span className="font-bold">{totalValor.toFixed(2)} MT</span> será imediatamente deduzido do sistema.
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setAbrirComandaModalAberto(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={aProcessar}
                onClick={handleConfirmarAberturaComanda}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
              >
                Confirmar e Lançar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS: CHECKOUT, RECIBO, QUEBRA E CONTAGEM CEGA                          */}
      {/* ========================================================================= */}
      <CheckoutModal
        isOpen={checkoutModalAberto}
        total={comandaParaLiquidar ? comandaParaLiquidar.total : totalValor}
        quantidadeItens={
          comandaParaLiquidar
            ? comandaParaLiquidar.itens.reduce((acc, i) => acc + i.quantidade, 0)
            : totalArtigos
        }
        isProcessing={aProcessar}
        onClose={() => {
          setCheckoutModalAberto(false);
          setComandaParaLiquidar(null);
        }}
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
          // Recarregar catálogo
          const params = new URLSearchParams({ estado: 'activo' });
          fetch(`/api/admin/produtos?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => setTodosProdutos(data.produtos ?? []));
        }}
      />

      <BlindCountModal
        isOpen={contagemModalAberto}
        onClose={() => setContagemModalAberto(false)}
      />
    </div>
  );
}
