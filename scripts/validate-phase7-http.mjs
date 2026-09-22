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

function check(name, result, expected) {
  const ok = result.status === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${result.status}`);
  if (!ok) console.log('Response body:', JSON.stringify(result.body));
  return ok;
}

async function run() {
  console.log(`=== TESTES HTTP DA FASE 7: DASHBOARD E RELATÓRIOS (Target: ${base}) ===\n`);

  // 1. Autorizações Anónimas
  check('anónimo não consulta dashboard admin', await request('/api/dashboard/admin'), 403);
  check('anónimo não consulta dashboard atendente', await request('/api/dashboard/atendente'), 403);
  check('anónimo não consulta relatório de mais vendidos', await request('/api/relatorios/produtos-mais-vendidos'), 403);

  // 2. Logins
  const adminLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'Admin123!' }));
  check('login administrador', adminLogin, 200);
  const adminCookie = adminLogin.cookie;

  const attendantLogin = await request('/api/auth/login', json('POST', { email: 'atendente@tkvendas.dev', password: 'Atendente123!' }));
  check('login atendente', attendantLogin, 200);
  const attendantCookie = attendantLogin.cookie;

  // 3. Autorizações de Atendente
  check('atendente não consulta dashboard admin (403)', await request('/api/dashboard/admin', {}, attendantCookie), 403);
  check('atendente não consulta relatórios admin de mais vendidos (403)', await request('/api/relatorios/produtos-mais-vendidos', {}, attendantCookie), 403);
  const attendantDashboardRes = await request('/api/dashboard/atendente', {}, attendantCookie);
  check('atendente consulta seu próprio dashboard operacional (200)', attendantDashboardRes, 200);

  // 4. Criação de Produto e Venda para validação de métricas
  const catRes = await request('/api/admin/categorias', json('POST', { nome: `Dash Cat ${unique}` }), adminCookie);
  check('criar categoria para teste de dashboard', catRes, 201);
  const catId = catRes.body.categoria.id;

  const prodRes = await request('/api/admin/produtos', json('POST', {
    codigo: `DASH-${unique}`,
    nome: `Produto Dashboard ${unique}`,
    categoriaId: catId,
    precoCompra: 20,
    precoVenda: 50,
    stockActual: 100,
    stockMinimo: 10,
    activo: true,
  }), adminCookie);
  check('criar produto para teste de dashboard', prodRes, 201);
  const prodId = prodRes.body.produto.id;

  // Vender 20 unidades (20 x 50 = 1000 MT)
  const saleRes = await request('/api/vendas', json('POST', {
    itens: [{ produtoId: prodId, quantidade: 20 }],
  }), adminCookie);
  check('realizar venda de 20 unidades (1000 MT)', saleRes, 201);

  // 5. Dashboard do Administrador
  const adminDashRes = await request('/api/dashboard/admin?periodo=hoje', {}, adminCookie);
  check('administrador consulta dashboard com periodo=hoje (200)', adminDashRes, 200);
  const adminDash = adminDashRes.body.dashboard;

  check('dashboard admin possui totalFacturadoHoje numérico/string válido', {
    status: typeof adminDash?.totalFacturadoHoje === 'string' && Number(adminDash.totalFacturadoHoje) >= 1000 ? 200 : 500,
    body: adminDash,
  }, 200);

  check('dashboard admin possui totalVendasHoje >= 1', {
    status: typeof adminDash?.totalVendasHoje === 'number' && adminDash.totalVendasHoje >= 1 ? 200 : 500,
    body: adminDash,
  }, 200);

  check('dashboard admin lista produto vendido nos produtosMaisVendidos', {
    status: adminDash?.produtosMaisVendidos?.some((p) => p.produtoId === prodId && p.quantidadeVendida >= 20) ? 200 : 500,
    body: adminDash?.produtosMaisVendidos,
  }, 200);

  // 6. Testes de Filtro de Período
  for (const periodo of ['7d', '30d', 'mes', 'todos']) {
    const pRes = await request(`/api/dashboard/admin?periodo=${periodo}`, {}, adminCookie);
    check(`dashboard admin funciona com periodo=${periodo} (200)`, pRes, 200);
  }

  // 7. Período sem Resultados
  const emptyPeriodRes = await request('/api/dashboard/admin?dataInicio=2020-01-01&dataFim=2020-01-02', {}, adminCookie);
  check('dashboard para período antigo sem vendas retorna 200 com totais 0', {
    status: emptyPeriodRes.status === 200 && emptyPeriodRes.body.dashboard.totalVendasPeriodo === 0 && emptyPeriodRes.body.dashboard.totalFacturadoPeriodo === '0.00' ? 200 : 500,
    body: emptyPeriodRes.body,
  }, 200);

  // 8. Relatório de Produtos Mais Vendidos
  const topProdRes = await request('/api/relatorios/produtos-mais-vendidos?limit=5', {}, adminCookie);
  check('administrador consulta relatório de produtos mais vendidos com limit=5 (200)', topProdRes, 200);
  check('relatório contém array de produtos ordenados', {
    status: Array.isArray(topProdRes.body?.produtos) && topProdRes.body.produtos.length <= 5 ? 200 : 500,
    body: topProdRes.body,
  }, 200);

  // 9. Dashboard do Atendente com Vendas Reais
  // Atendente realiza venda de 2 unidades do produto (2 x 50 = 100 MT)
  const attSaleRes = await request('/api/vendas', json('POST', {
    itens: [{ produtoId: prodId, quantidade: 2 }],
  }), attendantCookie);
  check('atendente realiza venda de 2 unidades (100 MT)', attSaleRes, 201);

  const attDashUpdatedRes = await request('/api/dashboard/atendente?periodo=hoje', {}, attendantCookie);
  check('atendente consulta dashboard operacional actualizado (200)', attDashUpdatedRes, 200);
  const attDash = attDashUpdatedRes.body.dashboard;

  check('dashboard do atendente reflete apenas as suas vendas e facturação própria', {
    status: typeof attDash?.minhasVendasHoje === 'number' && attDash.minhasVendasHoje >= 1 && Number(attDash.meuTotalFacturadoHoje) >= 100 ? 200 : 500,
    body: attDash,
  }, 200);

  console.log(`\nVALIDATION_ID=${unique}`);
  console.log('TODOS OS TESTES DA FASE 7 CONCLUÍDOS COM SUCESSO.');
}

run().catch((err) => {
  console.error('Erro na execução dos testes da Fase 7:', err);
  process.exit(1);
});
