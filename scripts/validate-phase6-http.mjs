const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const unique = Date.now();

async function request(path, options = {}, cookie = '') {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers, redirect: 'manual' });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text.slice(0, 120); }
  return { status: response.status, body, cookie: response.headers.getSetCookie?.()[0]?.split(';')[0] ?? '' };
}

const json = (method, body) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const form = (body) => ({ method: 'POST', body: new URLSearchParams(Object.entries(body)) });

function check(name, result, expected) {
  const ok = result.status === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${result.status}`);
  if (!ok) console.log('Response body:', JSON.stringify(result.body));
  return ok;
}

async function run() {
  console.log(`=== TESTES HTTP DA FASE 6 (Target: ${base}) ===\n`);

  // 1. Autorizações Anónimas
  check('anónimo não regista entrada', await request('/api/admin/stock/entrada', json('POST', { produtoId: 1, quantidade: 5 })), 403);
  check('anónimo não regista saída', await request('/api/admin/stock/saida', json('POST', { produtoId: 1, quantidade: 5 })), 403);
  check('anónimo não regista ajuste', await request('/api/admin/stock/ajuste', json('POST', { produtoId: 1, novoStock: 10, motivo: 'Teste' })), 403);
  check('anónimo não consulta movimentos', await request('/api/admin/stock/movimentos'), 403);

  // 2. Logins
  const adminLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'Admin123!' }));
  check('login administrador', adminLogin, 200);
  const adminCookie = adminLogin.cookie;

  const attendantLogin = await request('/api/auth/login', json('POST', { email: 'atendente@tkvendas.dev', password: 'Atendente123!' }));
  check('login atendente', attendantLogin, 200);
  const attendantCookie = attendantLogin.cookie;

  // 3. Permissões de Atendente
  check('atendente não regista entrada', await request('/api/admin/stock/entrada', json('POST', { produtoId: 1, quantidade: 5 }), attendantCookie), 403);
  check('atendente não regista saída', await request('/api/admin/stock/saida', json('POST', { produtoId: 1, quantidade: 5 }), attendantCookie), 403);
  check('atendente não regista ajuste', await request('/api/admin/stock/ajuste', json('POST', { produtoId: 1, novoStock: 10, motivo: 'Teste' }), attendantCookie), 403);
  check('atendente não consulta movimentos', await request('/api/admin/stock/movimentos', {}, attendantCookie), 403);

  // 4. Preparação de Categoria e Produtos de Teste
  const categoryRes = await request('/api/admin/categorias', json('POST', { nome: `Stock Cat ${unique}` }), adminCookie);
  check('criar categoria de teste', categoryRes, 201);
  const catId = categoryRes.body.categoria.id;

  const prodRes = await request('/api/admin/produtos', json('POST', {
    codigo: `STK-${unique}`,
    nome: `Produto Stock ${unique}`,
    categoriaId: catId,
    precoCompra: 10,
    precoVenda: 20,
    stockActual: 10,
    stockMinimo: 5,
    activo: true,
  }), adminCookie);
  check('criar produto de teste com stock 10', prodRes, 201);
  const prodId = prodRes.body.produto.id;

  // 5. Entrada de Stock
  const entryRes = await request('/api/admin/stock/entrada', json('POST', {
    produtoId: prodId,
    quantidade: 15,
    motivo: 'Compra fornecedor Lote A',
  }), adminCookie);
  check('entrada de 15 unidades válida (stock: 10 -> 25)', entryRes, 201);
  check('stock retornado na entrada é 25', { status: entryRes.body.produto.stockActual === 25 ? 200 : 500, body: entryRes.body }, 200);

  // Validações de Entrada
  check('entrada quantidade zero bloqueada', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodId, quantidade: 0 }), adminCookie), 400);
  check('entrada quantidade negativa bloqueada', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodId, quantidade: -5 }), adminCookie), 400);
  check('entrada quantidade decimal bloqueada', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodId, quantidade: 2.5 }), adminCookie), 400);
  check('entrada produto inexistente bloqueada', await request('/api/admin/stock/entrada', json('POST', { produtoId: 999999, quantidade: 5 }), adminCookie), 409);

  // 6. Saída Manual de Stock
  const exitRes = await request('/api/admin/stock/saida', json('POST', {
    produtoId: prodId,
    quantidade: 5,
    motivo: 'Produto quebrado no transporte',
  }), adminCookie);
  check('saída manual de 5 unidades válida (stock: 25 -> 20)', exitRes, 201);
  check('stock retornado na saída é 20', { status: exitRes.body.produto.stockActual === 20 ? 200 : 500, body: exitRes.body }, 200);

  // Validações de Saída
  check('saída com stock insuficiente bloqueada (409)', await request('/api/admin/stock/saida', json('POST', { produtoId: prodId, quantidade: 999 }), adminCookie), 409);
  check('saída quantidade zero bloqueada', await request('/api/admin/stock/saida', json('POST', { produtoId: prodId, quantidade: 0 }), adminCookie), 400);
  check('saída quantidade negativa bloqueada', await request('/api/admin/stock/saida', json('POST', { produtoId: prodId, quantidade: -2 }), adminCookie), 400);

  // 7. Ajuste de Stock
  const adjustDownRes = await request('/api/admin/stock/ajuste', json('POST', {
    produtoId: prodId,
    novoStock: 18,
    motivo: 'Inventário físico: 2 unidades avariadas',
  }), adminCookie);
  check('ajuste para stock menor (20 -> 18)', adjustDownRes, 201);
  check('stock após ajuste para 18', { status: adjustDownRes.body.produto.stockActual === 18 ? 200 : 500, body: adjustDownRes.body }, 200);

  const adjustUpRes = await request('/api/admin/stock/ajuste', json('POST', {
    produtoId: prodId,
    novoStock: 30,
    motivo: 'Inventário físico: encontrado lote extra no armazém',
  }), adminCookie);
  check('ajuste para stock maior (18 -> 30)', adjustUpRes, 201);

  // Validações de Ajuste
  check('ajuste sem motivo bloqueado (400)', await request('/api/admin/stock/ajuste', json('POST', { produtoId: prodId, novoStock: 25, motivo: '' }), adminCookie), 400);
  check('ajuste stock negativo bloqueado (400)', await request('/api/admin/stock/ajuste', json('POST', { produtoId: prodId, novoStock: -5, motivo: 'Negativo' }), adminCookie), 400);

  // 8. Produto Inactivo Bloqueado em Operações de Stock
  await request(`/api/admin/produtos/${prodId}/status`, form({ activo: 'false' }), adminCookie);
  check('entrada em produto inactivo bloqueada (409)', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodId, quantidade: 10 }), adminCookie), 409);
  check('saída em produto inactivo bloqueada (409)', await request('/api/admin/stock/saida', json('POST', { produtoId: prodId, quantidade: 5 }), adminCookie), 409);
  check('ajuste em produto inactivo bloqueado (409)', await request('/api/admin/stock/ajuste', json('POST', { produtoId: prodId, novoStock: 20, motivo: 'Inventário' }), adminCookie), 409);
  await request(`/api/admin/produtos/${prodId}/status`, form({ activo: 'true' }), adminCookie);

  // 9. Auditoria Integrada com Venda
  const saleRes = await request('/api/vendas', json('POST', {
    itens: [{ produtoId: prodId, quantidade: 3 }],
  }), attendantCookie);
  check('venda de 3 unidades pelo atendente (30 -> 27)', saleRes, 201);

  // 10. Consulta de Histórico de Movimentos e Auditoria
  const historyRes = await request('/api/admin/stock/movimentos', {}, adminCookie);
  check('administrador lista histórico global de movimentos (200)', historyRes, 200);

  const productMovementsRes = await request(`/api/admin/stock/movimentos?produtoId=${prodId}`, {}, adminCookie);
  check('filtrar movimentos por produto (200)', productMovementsRes, 200);
  const movs = productMovementsRes.body.movimentos;

  check('produto possui pelo menos 5 movimentos (Entrada, Saída, Ajuste 1, Ajuste 2, Venda)', {
    status: Array.isArray(movs) && movs.length >= 5 ? 200 : 500,
    body: { count: movs?.length },
  }, 200);

  const saleMovement = movs.find((m) => m.motivo?.startsWith('Venda #'));
  check('movimento de venda auditado correctamente com tipo SAIDA', {
    status: saleMovement && saleMovement.tipo === 'SAIDA' && saleMovement.quantidade === 3 ? 200 : 500,
    body: saleMovement,
  }, 200);

  console.log(`\nVALIDATION_ID=${unique}`);
  console.log(`PRODUCT_ID=${prodId} TOTAL_MOVEMENTS=${movs?.length}`);
}

run().catch((err) => {
  console.error('Erro na execução dos testes da Fase 6:', err);
  process.exit(1);
});
