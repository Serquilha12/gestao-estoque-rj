const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const unique = Date.now();
async function request(path, options = {}, cookie = '') { const headers = { ...(options.headers ?? {}) }; if (cookie) headers.cookie = cookie; const response = await fetch(`${base}${path}`, { ...options, headers }); const text = await response.text(); let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 80); } return { status: response.status, body, cookie: response.headers.getSetCookie?.()[0]?.split(';')[0] ?? '' }; }
const json = (method, body) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const form = (body) => ({ method: 'POST', body: new URLSearchParams(Object.entries(body)) });
function check(name, result, expected) { const ok = result.status === expected; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${result.status}`); if (!ok) console.log(JSON.stringify(result.body)); }
check('categoria sem sessão bloqueada', await request('/api/admin/categorias'), 403);
const adminLogin = await request('/api/auth/login', json('POST', { email: 'admin@tkvendas.dev', password: 'Admin123!' })); check('login administrador', adminLogin, 200); const adminCookie = adminLogin.cookie;
const categoryName = `Categoria Fase4 ${unique}`;
const createdCategory = await request('/api/admin/categorias', json('POST', { nome: categoryName, descricao: 'Categoria de validação' }), adminCookie); check('criar categoria', createdCategory, 201); const categoryId = createdCategory.body.categoria.id;
check('duplicar categoria bloqueado', await request('/api/admin/categorias', json('POST', { nome: ` ${categoryName} ` }), adminCookie), 409);
check('listar e pesquisar categorias', await request(`/api/admin/categorias?search=${encodeURIComponent(categoryName)}`, {}, adminCookie), 200);
check('editar categoria', await request('/api/admin/categorias', json('PUT', { id: categoryId, nome: `${categoryName} Editada`, descricao: 'Actualizada', activo: false }), adminCookie), 200);
check('activar categoria', await request(`/api/admin/categorias/${categoryId}/status`, form({ activo: 'true' }), adminCookie), 200);
const productCode = `F4-${unique}`; const productName = `Produto Fase4 ${unique}`;
const createdProduct = await request('/api/admin/produtos', json('POST', { codigo: productCode, nome: productName, descricao: 'Produto de validação', categoriaId: categoryId, precoCompra: 10.5, precoVenda: 15, stockActual: 2, stockMinimo: 5 }), adminCookie); check('criar produto', createdProduct, 201); const productId = createdProduct.body.produto.id;
check('duplicar código bloqueado', await request('/api/admin/produtos', json('POST', { codigo: ` ${productCode} `, nome: 'Duplicado', categoriaId: categoryId, precoCompra: 1, precoVenda: 2, stockActual: 1, stockMinimo: 1 }), adminCookie), 409);
check('listar e filtrar produtos', await request(`/api/admin/produtos?categoriaId=${categoryId}&search=${encodeURIComponent(productName)}`, {}, adminCookie), 200);
check('editar produto', await request('/api/admin/produtos', json('PUT', { id: productId, codigo: productCode, nome: `${productName} Editado`, descricao: 'Actualizado', categoriaId: categoryId, precoCompra: 11, precoVenda: 16, stockMinimo: 3, activo: false }), adminCookie), 200);
check('activar produto', await request(`/api/admin/produtos/${productId}/status`, form({ activo: 'true' }), adminCookie), 200);
const attendantLogin = await request('/api/auth/login', json('POST', { email: 'atendente@tkvendas.dev', password: 'Atendente123!' })); check('login atendente', attendantLogin, 200); const attendantCookie = attendantLogin.cookie;
check('atendente consulta categorias', await request('/api/admin/categorias', {}, attendantCookie), 200);
check('atendente consulta produtos', await request('/api/admin/produtos', {}, attendantCookie), 200);
check('atendente não cria categoria', await request('/api/admin/categorias', json('POST', { nome: `Bloqueada ${unique}` }), attendantCookie), 403);
check('atendente não altera produto', await request('/api/admin/produtos', json('PUT', { id: productId, codigo: productCode, nome: 'Não permitido', categoriaId: categoryId, precoCompra: 1, precoVenda: 2, stockMinimo: 1, activo: true }), attendantCookie), 403);
check('atendente não desactiva categoria', await request(`/api/admin/categorias/${categoryId}/status`, form({ activo: 'false' }), attendantCookie), 403);
check('atendente não desactiva produto', await request(`/api/admin/produtos/${productId}/status`, form({ activo: 'false' }), attendantCookie), 403);
check('db-check público', await request('/api/db-check'), 200);
console.log(`VALIDATION_ID=${unique}`);
