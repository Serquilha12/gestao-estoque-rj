const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const unique = Date.now();

let totalPassed = 0;
let totalFailed = 0;

async function request(path, options = {}, cookie = '') {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers, redirect: 'manual' });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 120);
  }
  return {
    status: response.status,
    location: response.headers.get('location'),
    body,
    cookie: response.headers.getSetCookie?.()[0]?.split(';')[0] ?? '',
  };
}

const json = (method, body) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const form = (body) => ({
  method: 'POST',
  body: new URLSearchParams(Object.entries(body)),
});

function check(phase, name, result, expected) {
  const expectedArray = Array.isArray(expected) ? expected : [expected];
  const ok = expectedArray.includes(result.status);
  if (ok) {
    totalPassed++;
    console.log(`[PASS] [${phase}] ${name} -> Status ${result.status}`);
  } else {
    totalFailed++;
    console.error(`[FAIL] [${phase}] ${name} -> Expected ${expectedArray.join('/')}, got ${result.status}. Body:`, JSON.stringify(result.body));
  }
  return ok;
}

async function run() {
  console.log(`=== INICIANDO REGRESSÃO COMPLETA FASES 1–8 (Target: ${base}) ===\n`);

  // ==========================================
  // FASE 1: BASE DE DADOS & HEALTHCHECK
  // ==========================================
  console.log('--- FASE 1: Base de Dados & Healthcheck ---');
  const dbCheck = await request('/api/db-check');
  check('FASE 1', 'DB Check endpoint activo e funcional', dbCheck, 200);

  // ==========================================
  // FASE 2: AUTENTICAÇÃO & SESSÃO
  // ==========================================
  console.log('\n--- FASE 2: Autenticação & Sessão ---');
  const sessionAnon = await request('/api/auth/session');
  check('FASE 2', 'Sessão anónima retorna não autenticado (401)', sessionAnon, 401);

  const invalidLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'PasswordErrada123!' }));
  check('FASE 2', 'Login com credenciais inválidas bloqueado (401)', invalidLogin, 401);

  const adminLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'Admin123!' }));
  check('FASE 2', 'Login de Administrador com sucesso', adminLogin, 200);
  const adminCookie = adminLogin.cookie;

  const attendantLogin = await request('/api/auth/login', json('POST', { email: 'atendente@tkvendas.dev', password: 'Atendente123!' }));
  check('FASE 2', 'Login de Atendente com sucesso', attendantLogin, 200);
  const attendantCookie = attendantLogin.cookie;

  // ==========================================
  // FASE 3: GESTÃO DE UTILIZADORES & PERMISSÕES
  // ==========================================
  console.log('\n--- FASE 3: Gestão de Utilizadores & Permissões ---');
  const anonUsers = await request('/api/admin/users');
  check('FASE 3', 'Anónimo não lista utilizadores (403)', anonUsers, 403);

  const attUsers = await request('/api/admin/users', {}, attendantCookie);
  check('FASE 3', 'Atendente não lista utilizadores (403)', attUsers, 403);

  const admUsers = await request('/api/admin/users', {}, adminCookie);
  check('FASE 3', 'Administrador lista utilizadores (200)', admUsers, 200);

  const newAdmin = await request(
    '/api/admin/users',
    json('POST', {
      nome: `Operador ${unique}`,
      email: `operador${unique}@tkvendas.dev`,
      password: 'UserPass123!',
      perfil: 'ATENDENTE',
    }),
    adminCookie
  );
  check('FASE 3', 'Administrador cria novo utilizador (201)', newAdmin, 201);

  const dupEmail = await request(
    '/api/admin/users',
    json('POST', {
      nome: `Operador Repetido`,
      email: `operador${unique}@tkvendas.dev`,
      password: 'UserPass123!',
      perfil: 'ATENDENTE',
    }),
    adminCookie
  );
  check('FASE 3', 'Email duplicado bloqueado (409)', dupEmail, 409);

  // ==========================================
  // FASE 4: CATÁLOGO (CATEGORIAS E PRODUTOS)
  // ==========================================
  console.log('\n--- FASE 4: Catálogo (Categorias e Produtos) ---');
  check('FASE 4', 'Anónimo não cria categoria (403)', await request('/api/admin/categorias', json('POST', { nome: 'Cat Anon' })), 403);
  check('FASE 4', 'Atendente não cria categoria (403)', await request('/api/admin/categorias', json('POST', { nome: 'Cat Att' }), attendantCookie), 403);

  const catNullDesc = await request('/api/admin/categorias', json('POST', { nome: `Cat A ${unique}`, descricao: null }), adminCookie);
  check('FASE 4', 'Criar Categoria com descricao: null (201)', catNullDesc, 201);
  const catAId = catNullDesc.body.categoria.id;

  const catStrDesc = await request('/api/admin/categorias', json('POST', { nome: `Cat B ${unique}`, descricao: 'Descricao valida' }), adminCookie);
  check('FASE 4', 'Criar Categoria com descricao string (201)', catStrDesc, 201);
  const catBId = catStrDesc.body.categoria.id;

  check('FASE 4', 'Nome de categoria duplicado bloqueado (409)', await request('/api/admin/categorias', json('POST', { nome: `Cat A ${unique}` }), adminCookie), 409);
  check('FASE 4', 'Pesquisa de categorias (200)', await request(`/api/admin/categorias?search=Cat+A`, {}, adminCookie), 200);
  check('FASE 4', 'Actualizar categoria (200)', await request('/api/admin/categorias', json('PUT', { id: catBId, nome: `Cat B Editada ${unique}`, descricao: null, activo: true }), adminCookie), 200);
  check('FASE 4', 'Alterar status da categoria (303)', await request(`/api/admin/categorias/${catBId}/status`, form({ activo: 'false' }), adminCookie), 303);

  const prodNullDesc = await request('/api/admin/produtos', json('POST', {
    codigo: `PNA-${unique}`,
    nome: `Produto A ${unique}`,
    descricao: null,
    categoriaId: catAId,
    precoCompra: 10,
    precoVenda: 25,
    stockActual: 100,
    stockMinimo: 5,
    activo: true,
  }), adminCookie);
  check('FASE 4', 'Criar Produto com descricao: null (201)', prodNullDesc, 201);
  const prodAId = prodNullDesc.body.produto.id;

  const prodStrDesc = await request('/api/admin/produtos', json('POST', {
    codigo: `PNB-${unique}`,
    nome: `Produto B ${unique}`,
    descricao: 'Descricao valida do produto B',
    categoriaId: catAId,
    precoCompra: 15,
    precoVenda: 30,
    stockActual: 50,
    stockMinimo: 5,
    activo: true,
  }), adminCookie);
  check('FASE 4', 'Criar Produto com descricao string (201)', prodStrDesc, 201);
  const prodBId = prodStrDesc.body.produto.id;

  check('FASE 4', 'Código de produto duplicado bloqueado (409)', await request('/api/admin/produtos', json('POST', {
    codigo: `PNA-${unique}`,
    nome: `Produto Duplicado`,
    categoriaId: catAId,
    precoCompra: 10,
    precoVenda: 20,
  }), adminCookie), 409);

  check('FASE 4', 'Preço venda < compra bloqueado (400)', await request('/api/admin/produtos', json('POST', {
    codigo: `PNC-${unique}`,
    nome: `Produto Invalido`,
    categoriaId: catAId,
    precoCompra: 50,
    precoVenda: 20,
  }), adminCookie), 400);

  check('FASE 4', 'Atendente consulta produtos filtrados (200)', await request(`/api/admin/produtos?search=Produto+A`, {}, attendantCookie), 200);

  const updateProd = await request('/api/admin/produtos', json('PUT', {
    id: prodAId,
    codigo: `PNA-${unique}`,
    nome: `Produto A Actualizado ${unique}`,
    descricao: null,
    categoriaId: catAId,
    precoCompra: 12,
    precoVenda: 28,
    stockMinimo: 10,
    activo: true,
  }), adminCookie);
  check('FASE 4', 'Actualizar produto com descricao null (200)', updateProd, 200);

  // ==========================================
  // FASE 5: NÚCLEO DE VENDAS & TRANSAÇÕES
  // ==========================================
  console.log('\n--- FASE 5: Núcleo de Vendas & Transações ---');
  check('FASE 5', 'Anónimo não cria venda (403)', await request('/api/vendas', json('POST', { itens: [{ produtoId: prodAId, quantidade: 1 }] })), 403);

  const sale1 = await request('/api/vendas', json('POST', { itens: [{ produtoId: prodAId, quantidade: 2 }] }), attendantCookie);
  check('FASE 5', 'Atendente cria venda com sucesso (201)', sale1, 201);
  const sale1Id = sale1.body.venda.id;

  const saleMulti = await request('/api/vendas', json('POST', {
    itens: [
      { produtoId: prodAId, quantidade: 3 },
      { produtoId: prodBId, quantidade: 2 },
      { produtoId: prodAId, quantidade: 1 },
    ],
  }), attendantCookie);
  check('FASE 5', 'Venda com múltiplos itens e repetição acumulada (201)', saleMulti, 201);

  const saleOverstock = await request('/api/vendas', json('POST', { itens: [{ produtoId: prodAId, quantidade: 99999 }] }), attendantCookie);
  check('FASE 5', 'Tentativa de venda com stock insuficiente bloqueada (409)', saleOverstock, 409);

  check('FASE 5', 'Quantidade zero bloqueada (400)', await request('/api/vendas', json('POST', { itens: [{ produtoId: prodAId, quantidade: 0 }] }), attendantCookie), 400);
  check('FASE 5', 'Quantidade negativa bloqueada (400)', await request('/api/vendas', json('POST', { itens: [{ produtoId: prodAId, quantidade: -5 }] }), attendantCookie), 400);
  check('FASE 5', 'Quantidade decimal bloqueada (400)', await request('/api/vendas', json('POST', { itens: [{ produtoId: prodAId, quantidade: 1.5 }] }), attendantCookie), 400);
  check('FASE 5', 'Produto inexistente bloqueado (409)', await request('/api/vendas', json('POST', { itens: [{ produtoId: 9999999, quantidade: 1 }] }), attendantCookie), 409);
  check('FASE 5', 'Carrinho vazio bloqueado (400)', await request('/api/vendas', json('POST', { itens: [] }), attendantCookie), 400);

  await request(`/api/admin/produtos/${prodBId}/status`, form({ activo: 'false' }), adminCookie);
  check('FASE 5', 'Venda com produto inactivo bloqueada (409)', await request('/api/vendas', json('POST', { itens: [{ produtoId: prodBId, quantidade: 1 }] }), attendantCookie), 409);
  await request(`/api/admin/produtos/${prodBId}/status`, form({ activo: 'true' }), adminCookie);

  check('FASE 5', 'Administrador consulta histórico global de vendas (200)', await request('/api/vendas', {}, adminCookie), 200);
  check('FASE 5', 'Atendente consulta histórico próprio de vendas (200)', await request('/api/vendas', {}, attendantCookie), 200);
  check('FASE 5', 'Consulta detalhe da venda com itens e produto (200)', await request(`/api/vendas/${sale1Id}`, {}, attendantCookie), 200);

  // ==========================================
  // FASE 6: GESTÃO E AUDITORIA DE STOCK
  // ==========================================
  console.log('\n--- FASE 6: Gestão e Auditoria de Stock ---');
  check('FASE 6', 'Anónimo não regista entrada de stock (403)', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodAId, quantidade: 10 })), 403);
  check('FASE 6', 'Atendente não regista entrada de stock (403)', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodAId, quantidade: 10 }), attendantCookie), 403);

  const entryRes = await request('/api/admin/stock/entrada', json('POST', { produtoId: prodAId, quantidade: 20, motivo: 'Compra fornecedor' }), adminCookie);
  check('FASE 6', 'Administrador regista entrada de stock (201)', entryRes, 201);

  check('FASE 6', 'Entrada quantidade zero bloqueada (400)', await request('/api/admin/stock/entrada', json('POST', { produtoId: prodAId, quantidade: 0 }), adminCookie), 400);
  check('FASE 6', 'Entrada produto inexistente bloqueada (409)', await request('/api/admin/stock/entrada', json('POST', { produtoId: 999999, quantidade: 5 }), adminCookie), 409);

  const exitRes = await request('/api/admin/stock/saida', json('POST', { produtoId: prodAId, quantidade: 5, motivo: 'Descarte danificado' }), adminCookie);
  check('FASE 6', 'Administrador regista saída manual de stock (201)', exitRes, 201);

  check('FASE 6', 'Saída manual com stock insuficiente bloqueada (409)', await request('/api/admin/stock/saida', json('POST', { produtoId: prodAId, quantidade: 999999 }), adminCookie), 409);

  const adjRes = await request('/api/admin/stock/ajuste', json('POST', { produtoId: prodAId, novoStock: 85, motivo: 'Inventário físico anual' }), adminCookie);
  check('FASE 6', 'Administrador regista ajuste de stock (201)', adjRes, 201);

  check('FASE 6', 'Ajuste sem motivo bloqueado (400)', await request('/api/admin/stock/ajuste', json('POST', { produtoId: prodAId, novoStock: 80, motivo: '' }), adminCookie), 400);

  check('FASE 6', 'Atendente não consulta histórico de stock (403)', await request('/api/admin/stock/movimentos', {}, attendantCookie), 403);

  const movementsRes = await request(`/api/admin/stock/movimentos?produtoId=${prodAId}`, {}, adminCookie);
  check('FASE 6', 'Administrador consulta histórico de movimentos filtrado (200)', movementsRes, 200);

  const movList = movementsRes.body.movimentos;
  check('FASE 6', 'Histórico contém movimentos registados para o produto', {
    status: Array.isArray(movList) && movList.length >= 3 ? 200 : 500,
    body: { count: movList?.length },
  }, 200);

  // ==========================================
  // FASE 7: DASHBOARD E RELATÓRIOS
  // ==========================================
  console.log('\n--- FASE 7: Dashboard e Relatórios ---');
  check('FASE 7', 'Anónimo não consulta dashboard admin (403)', await request('/api/dashboard/admin'), 403);
  check('FASE 7', 'Anónimo não consulta dashboard atendente (403)', await request('/api/dashboard/atendente'), 403);
  check('FASE 7', 'Anónimo não consulta relatório de mais vendidos (403)', await request('/api/relatorios/produtos-mais-vendidos'), 403);
  check('FASE 7', 'Atendente não consulta dashboard admin (403)', await request('/api/dashboard/admin', {}, attendantCookie), 403);
  check('FASE 7', 'Atendente não consulta relatórios admin de mais vendidos (403)', await request('/api/relatorios/produtos-mais-vendidos', {}, attendantCookie), 403);

  const adminDashRes = await request('/api/dashboard/admin?periodo=hoje', {}, adminCookie);
  check('FASE 7', 'Administrador consulta dashboard com periodo=hoje (200)', adminDashRes, 200);
  const adminDash = adminDashRes.body.dashboard;
  check('FASE 7', 'Dashboard admin possui totais de facturação e vendas válidos', {
    status: typeof adminDash?.totalFacturadoHoje === 'string' && typeof adminDash?.totalVendasHoje === 'number' ? 200 : 500,
    body: adminDash,
  }, 200);
  check('FASE 7', 'Dashboard admin possui listas de produtos mais vendidos e alertas de stock', {
    status: Array.isArray(adminDash?.produtosMaisVendidos) && Array.isArray(adminDash?.produtosStockBaixo) ? 200 : 500,
    body: adminDash,
  }, 200);

  const topProdRes = await request('/api/relatorios/produtos-mais-vendidos?limit=5', {}, adminCookie);
  check('FASE 7', 'Administrador consulta relatório de produtos mais vendidos (200)', topProdRes, 200);

  const attDashRes = await request('/api/dashboard/atendente?periodo=hoje', {}, attendantCookie);
  check('FASE 7', 'Atendente consulta dashboard operacional próprio (200)', attDashRes, 200);
  const attDash = attDashRes.body.dashboard;
  check('FASE 7', 'Dashboard atendente contém métricas operacionais próprias', {
    status: typeof attDash?.minhasVendasHoje === 'number' && typeof attDash?.meuTotalFacturadoHoje === 'string' ? 200 : 500,
    body: attDash,
  }, 200);

  // ==========================================
  // FASE 8: FECHO OPERACIONAL E UX
  // ==========================================
  console.log('\n--- FASE 8: Fecho Operacional e UX ---');
  check('FASE 8', 'Anónimo ao aceder /app/admin é protegido com redirect', await request('/app/admin'), [307, 302, 303, 401, 403]);
  check('FASE 8', 'Anónimo ao aceder /app/vendas é protegido com redirect', await request('/app/vendas'), [307, 302, 303, 401, 403]);
  check('FASE 8', 'Atendente acede a /app/atendente (200)', await request('/app/atendente', {}, attendantCookie), 200);
  check('FASE 8', 'Atendente acede a /app/vendas (200)', await request('/app/vendas', {}, attendantCookie), 200);
  check('FASE 8', 'Atendente acede a /app/vendas/historico (200)', await request('/app/vendas/historico', {}, attendantCookie), 200);
  check('FASE 8', 'Atendente acede a /app/admin/produtos (200)', await request('/app/admin/produtos', {}, attendantCookie), 200);
  check('FASE 8', 'Atendente acede a /app/perfil (200)', await request('/app/perfil', {}, attendantCookie), 200);
  check('FASE 8', 'Atendente bloqueado de /app/admin', await request('/app/admin', {}, attendantCookie), [307, 302, 303, 403]);
  check('FASE 8', 'Atendente bloqueado de /app/admin/stock', await request('/app/admin/stock', {}, attendantCookie), [307, 302, 303, 403]);
  check('FASE 8', 'Atendente bloqueado de /app/admin/relatorios', await request('/app/admin/relatorios', {}, attendantCookie), [307, 302, 303, 403]);
  check('FASE 8', 'Atendente bloqueado de /app/admin/users', await request('/app/admin/users', {}, attendantCookie), [307, 302, 303, 403]);
  check('FASE 8', 'Administrador acede a /app/admin (200)', await request('/app/admin', {}, adminCookie), 200);
  check('FASE 8', 'Administrador acede a /app/admin/stock (200)', await request('/app/admin/stock', {}, adminCookie), 200);
  check('FASE 8', 'Administrador acede a /app/admin/relatorios (200)', await request('/app/admin/relatorios', {}, adminCookie), 200);
  check('FASE 8', 'Administrador acede a /app/admin/users (200)', await request('/app/admin/users', {}, adminCookie), 200);
  check('FASE 8', 'Administrador acede a /app/perfil (200)', await request('/app/perfil', {}, adminCookie), 200);

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log(`\n==========================================`);
  console.log(`TOTAL DE TESTES EXECUTADOS: ${totalPassed + totalFailed}`);
  console.log(`PASSOU: ${totalPassed}`);
  console.log(`FALHOU: ${totalFailed}`);
  console.log(`==========================================\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
