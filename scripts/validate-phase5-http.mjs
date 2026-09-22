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
function check(name, result, expected) { const ok = result.status === expected; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${result.status}`); if (!ok) console.log(JSON.stringify(result.body)); return ok; }

check('venda sem sessão bloqueada', await request('/api/vendas', json('POST', { itens: [{ produtoId: 1, quantidade: 1 }] })), 403);
const adminLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'Admin123!' })); check('login administrador', adminLogin, 200); const admin = adminLogin.cookie;
const category = await request('/api/admin/categorias', json('POST', { nome: `Vendas ${unique}` }), admin); check('criar categoria de teste', category, 201); const categoriaId = category.body.categoria.id;
const productA = await request('/api/admin/produtos', json('POST', { codigo: `V-A-${unique}`, nome: `Produto Venda A ${unique}`, categoriaId, precoCompra: 10, precoVenda: 25, stockActual: 10, stockMinimo: 2 }), admin); check('criar produto A', productA, 201); const produtoA = productA.body.produto.id;
const productB = await request('/api/admin/produtos', json('POST', { codigo: `V-B-${unique}`, nome: `Produto Venda B ${unique}`, categoriaId, precoCompra: 5, precoVenda: 12.5, stockActual: 6, stockMinimo: 1 }), admin); check('criar produto B', productB, 201); const produtoB = productB.body.produto.id;
const sale = await request('/api/vendas', json('POST', { itens: [{ produtoId: produtoA, quantidade: 2 }] }), admin); check('venda normal', sale, 201); const vendaId = sale.body.venda?.id;
check('venda com vários produtos e item repetido', await request('/api/vendas', json('POST', { itens: [{ produtoId: produtoA, quantidade: 1 }, { produtoId: produtoA, quantidade: 2 }, { produtoId: produtoB, quantidade: 2 }] }), admin), 201);
const insufficient = await request('/api/vendas', json('POST', { itens: [{ produtoId: produtoA, quantidade: 999 }, { produtoId: produtoB, quantidade: 1 }] }), admin); check('stock insuficiente', insufficient, 409);
for (const [label, itens] of [['quantidade zero', [{ produtoId: produtoA, quantidade: 0 }]], ['quantidade negativa', [{ produtoId: produtoA, quantidade: -1 }]], ['quantidade decimal', [{ produtoId: produtoA, quantidade: 1.5 }]], ['produto inexistente', [{ produtoId: 999999, quantidade: 1 }]], ['carrinho vazio', []]]) check(label, await request('/api/vendas', json('POST', { itens }), admin), label === 'produto inexistente' ? 409 : 400);
check('histórico administrador', await request('/api/vendas', {}, admin), 200);
check('detalhe da venda', await request(`/api/vendas/${vendaId}`, {}, admin), 200);
check('produto inactivo bloqueado', await request(`/api/admin/produtos/${produtoB}/status`, form({ activo: 'false' }), admin), 303);
check('venda de produto inactivo', await request('/api/vendas', json('POST', { itens: [{ produtoId: produtoB, quantidade: 1 }] }), admin), 409);
const attendantLogin = await request('/api/auth/login', json('POST', { email: 'atendente@tkvendas.dev', password: 'Atendente123!' })); check('login atendente', attendantLogin, 200); const attendant = attendantLogin.cookie;
check('atendente cria venda', await request('/api/vendas', json('POST', { itens: [{ produtoId: produtoA, quantidade: 1 }] }), attendant), 201);
check('atendente consulta histórico próprio', await request('/api/vendas', {}, attendant), 200);
check('atendente não cria produto', await request('/api/admin/produtos', json('POST', { codigo: `NO-${unique}`, nome: 'Não permitido', categoriaId, precoCompra: 1, precoVenda: 2, stockActual: 1, stockMinimo: 0 }), attendant), 403);
console.log(`VALIDATION_ID=${unique}`);
console.log(`PRODUCT_A=${produtoA} PRODUCT_B=${produtoB} FIRST_SALE=${vendaId}`);
