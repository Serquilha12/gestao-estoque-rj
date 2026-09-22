const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const unique = Date.now();

async function request(path, options = {}, cookie = '') {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers, redirect: 'manual' });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 160);
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

let total = 0;
let passed = 0;
let failed = 0;

function check(name, result, expectedStatuses) {
  total++;
  const expectedArray = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  const ok = expectedArray.includes(result.status);
  if (ok) {
    passed++;
    console.log(`[PASS] ${name} -> Status ${result.status}`);
  } else {
    failed++;
    console.log(`[FAIL] ${name} -> Got ${result.status}, expected ${expectedArray.join('/')}`);
    console.log('Location:', result.location);
    console.log('Body:', JSON.stringify(result.body));
  }
  return ok;
}

async function run() {
  console.log(`=== TESTES DE INTEGRAÇÃO & FECHO OPERACIONAL — FASE 8 (Target: ${base}) ===\n`);

  // 1. Protecção de Rotas para Anónimos (deve redireccionar para /login com 307/302/303 ou 401/403)
  const anonAdminPage = await request('/app/admin');
  check('Anónimo ao aceder /app/admin é redireccionado para /login', anonAdminPage, [307, 302, 303, 401, 403]);

  const anonVendasPage = await request('/app/vendas');
  check('Anónimo ao aceder /app/vendas é redireccionado para /login', anonVendasPage, [307, 302, 303, 401, 403]);

  const anonStockPage = await request('/app/admin/stock');
  check('Anónimo ao aceder /app/admin/stock é redireccionado para /login', anonStockPage, [307, 302, 303, 401, 403]);

  // 2. Autenticações
  const adminLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'Admin123!' }));
  check('Login Administrador', adminLogin, 200);
  const adminCookie = adminLogin.cookie;

  const attendantLogin = await request('/api/auth/login', json('POST', { email: 'atendente@tkvendas.dev', password: 'Atendente123!' }));
  check('Login Atendente', attendantLogin, 200);
  const attendantCookie = attendantLogin.cookie;

  // 3. Acessos do Atendente
  const attDash = await request('/app/atendente', {}, attendantCookie);
  check('Atendente acede a /app/atendente (200)', attDash, 200);

  const attVendas = await request('/app/vendas', {}, attendantCookie);
  check('Atendente acede a /app/vendas (200)', attVendas, 200);

  const attHistorico = await request('/app/vendas/historico', {}, attendantCookie);
  check('Atendente acede a /app/vendas/historico (200)', attHistorico, 200);

  const attProdutos = await request('/app/admin/produtos', {}, attendantCookie);
  check('Atendente acede a consulta de catálogo /app/admin/produtos (200)', attProdutos, 200);

  const attPerfil = await request('/app/perfil', {}, attendantCookie);
  check('Atendente acede a /app/perfil (200)', attPerfil, 200);

  // Atendente bloqueado em rotas estritamente administrativas
  const attAdminDash = await request('/app/admin', {}, attendantCookie);
  check('Atendente bloqueado de /app/admin', attAdminDash, [307, 302, 303, 403]);

  const attStock = await request('/app/admin/stock', {}, attendantCookie);
  check('Atendente bloqueado de /app/admin/stock', attStock, [307, 302, 303, 403]);

  const attRelatorios = await request('/app/admin/relatorios', {}, attendantCookie);
  check('Atendente bloqueado de /app/admin/relatorios', attRelatorios, [307, 302, 303, 403]);

  const attUsers = await request('/app/admin/users', {}, attendantCookie);
  check('Atendente bloqueado de /app/admin/users', attUsers, [307, 302, 303, 403]);

  // 4. Acessos do Administrador a Todas as Áreas
  const admDash = await request('/app/admin', {}, adminCookie);
  check('Administrador acede a /app/admin (200)', admDash, 200);

  const admStock = await request('/app/admin/stock', {}, adminCookie);
  check('Administrador acede a /app/admin/stock (200)', admStock, 200);

  const admProd = await request('/app/admin/produtos', {}, adminCookie);
  check('Administrador acede a /app/admin/produtos (200)', admProd, 200);

  const admCat = await request('/app/admin/categorias', {}, adminCookie);
  check('Administrador acede a /app/admin/categorias (200)', admCat, 200);

  const admRel = await request('/app/admin/relatorios', {}, adminCookie);
  check('Administrador acede a /app/admin/relatorios (200)', admRel, 200);

  const admUsers = await request('/app/admin/users', {}, adminCookie);
  check('Administrador acede a /app/admin/users (200)', admUsers, 200);

  const admPerfil = await request('/app/perfil', {}, adminCookie);
  check('Administrador acede a /app/perfil (200)', admPerfil, 200);

  // 5. Fluxo Operacional Completo: Criar Produto -> Vender no PDV -> Emitir Comprovativo
  const catRes = await request('/api/admin/categorias', json('POST', { nome: `Cat UX ${unique}` }), adminCookie);
  check('Criação de categoria para teste UX', catRes, 201);
  const catId = catRes.body.categoria.id;

  const prodRes = await request(
    '/api/admin/produtos',
    json('POST', {
      codigo: `UX-${unique}`,
      nome: `Produto UX Teste ${unique}`,
      categoriaId: catId,
      precoCompra: 50,
      precoVenda: 100,
      stockActual: 10,
      stockMinimo: 2,
      activo: true,
    }),
    adminCookie
  );
  check('Criação de produto no catálogo', prodRes, 201);
  const prodId = prodRes.body.produto.id;

  // Atendente realiza venda no PDV
  const vendaRes = await request(
    '/api/vendas',
    json('POST', {
      itens: [{ produtoId: prodId, quantidade: 3 }],
    }),
    attendantCookie
  );
  check('Atendente efectua venda no PDV com sucesso', vendaRes, 201);
  const vendaId = vendaRes.body.venda.id;

  // Visualização do Comprovativo da Venda
  const detalheRes = await request(`/app/vendas/${vendaId}`, {}, attendantCookie);
  check('Visualização do comprovativo da venda /app/vendas/:id (200)', detalheRes, 200);

  // Verificar histórico de vendas
  const histRes = await request(`/api/vendas/${vendaId}`, {}, attendantCookie);
  check('API de detalhe da venda retorna itens e total correctos', histRes, 200);

  console.log('\n==========================================');
  console.log(`TOTAL DE TESTES EXECUTADOS: ${total}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
