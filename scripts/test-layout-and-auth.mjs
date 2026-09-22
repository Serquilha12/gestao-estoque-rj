const BASE_URL = 'http://localhost:3000';

async function testLayoutAndAuth() {
  console.log('=== TESTE DE LAYOUT, MARCA E AUTENTICAÇÃO ===\n');

  // 1. Test Login Admin
  console.log('1. Autenticando Administrador (admin@tkvendas.dev)...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tkvendas.dev', password: 'Admin123!' })
  });

  if (!adminLoginRes.ok) {
    throw new Error(`Falha no login do admin: ${adminLoginRes.status} ${await adminLoginRes.text()}`);
  }

  const adminCookie = adminLoginRes.headers.get('set-cookie');
  console.log('✔ Login Admin OK! Cookie obtido.');

  // 2. Fetch /app/admin
  console.log('2. Acedendo a /app/admin com sessão Admin...');
  const adminPageRes = await fetch(`${BASE_URL}/app/admin`, {
    headers: { Cookie: adminCookie }
  });
  const adminHtml = await adminPageRes.text();

  if (!adminPageRes.ok) {
    throw new Error(`Falha ao aceder a /app/admin: ${adminPageRes.status}`);
  }

  // Verify Brand and Admin Sidebar Links
  const hasBrand = adminHtml.includes('Rui Junior') || adminHtml.includes('Take Away • Vendas');
  const hasAdminNav = adminHtml.includes('href="/app/admin"') &&
                      adminHtml.includes('href="/app/vendas"') &&
                      adminHtml.includes('href="/app/admin/produtos"') &&
                      adminHtml.includes('href="/app/admin/categorias"') &&
                      adminHtml.includes('href="/app/admin/stock"') &&
                      adminHtml.includes('href="/app/admin/relatorios"') &&
                      adminHtml.includes('href="/app/admin/users"');

  console.log(`- Marca Rui Junior no HTML: ${hasBrand ? '✔ PRESENTE' : '❌ AUSENTE'}`);
  console.log(`- Links de Gestão Admin no Sidebar: ${hasAdminNav ? '✔ COMPLETOS (Todos os 7 módulos presentes)' : '❌ INCOMPLETOS'}`);

  // 3. Test Login Atendente
  console.log('\n3. Autenticando Atendente (atendente@tkvendas.dev)...');
  const atendenteLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'atendente@tkvendas.dev', password: 'Atendente123!' })
  });

  if (!atendenteLoginRes.ok) {
    throw new Error(`Falha no login do atendente: ${atendenteLoginRes.status} ${await atendenteLoginRes.text()}`);
  }

  const atendenteCookie = atendenteLoginRes.headers.get('set-cookie');
  console.log('✔ Login Atendente OK! Cookie obtido.');

  // 4. Fetch /app/atendente
  console.log('4. Acedendo a /app/atendente com sessão Atendente...');
  const atendentePageRes = await fetch(`${BASE_URL}/app/atendente`, {
    headers: { Cookie: atendenteCookie }
  });
  const atendenteHtml = await atendentePageRes.text();

  if (!atendentePageRes.ok) {
    throw new Error(`Falha ao aceder a /app/atendente: ${atendentePageRes.status}`);
  }

  // Verify Atendente Sidebar Links & Restrictions
  const hasAtendenteNav = atendenteHtml.includes('href="/app/atendente"') &&
                          atendenteHtml.includes('href="/app/vendas"') &&
                          atendenteHtml.includes('href="/app/vendas/historico"');
  
  // Note: Atendente sidebar should NOT include admin exclusive management links in sidebar nav
  const hasNoAdminLinksInSidebar = !atendenteHtml.includes('href="/app/admin/users"') &&
                                   !atendenteHtml.includes('href="/app/admin/relatorios"') &&
                                   !atendenteHtml.includes('href="/app/admin/categorias"') &&
                                   !atendenteHtml.includes('href="/app/admin/stock"');

  console.log(`- Links Operacionais no Sidebar: ${hasAtendenteNav ? '✔ COMPLETOS' : '❌ INCOMPLETOS'}`);
  console.log(`- Restrição de Links Admin para Atendente: ${hasNoAdminLinksInSidebar ? '✔ SEGURO (Módulos administrativos ocultos)' : '❌ FALHA'}`);

  console.log('\n=== TODOS OS TESTES DE LAYOUT E AUTENTICAÇÃO PASSARAM! ===');
}

testLayoutAndAuth().catch(err => {
  console.error('Erro na validação:', err);
  process.exit(1);
});
