import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../src/prisma/contract.d';
import contractJson from '../src/prisma/contract.json' with { type: 'json' };

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) throw new Error('DATABASE_URL is not defined in environment');

const db = postgres<Contract>({ contractJson, url: databaseUrl });

export async function cleanTestData() {
  console.log('--- INICIANDO LIMPEZA TOTAL E SEGURA DE DADOS DE TESTE ---');

  // 1. Remover Itens de Venda
  const allItems = await db.orm.public.ItemVenda.all();
  for (const item of allItems) {
    await db.orm.public.ItemVenda.where({ id: item.id }).delete();
  }
  console.log(`[OK] Removidos ${allItems.length} itens de venda.`);

  // 2. Remover Vendas
  const allSales = await db.orm.public.Venda.all();
  for (const sale of allSales) {
    await db.orm.public.Venda.where({ id: sale.id }).delete();
  }
  console.log(`[OK] Removidas ${allSales.length} vendas.`);

  // 3. Remover Movimentos de Stock
  const allMovements = await db.orm.public.MovimentoStock.all();
  for (const mov of allMovements) {
    await db.orm.public.MovimentoStock.where({ id: mov.id }).delete();
  }
  console.log(`[OK] Removidos ${allMovements.length} movimentos de stock.`);

  // 4. Remover Produtos
  const allProducts = await db.orm.public.Produto.all();
  for (const prod of allProducts) {
    await db.orm.public.Produto.where({ id: prod.id }).delete();
  }
  console.log(`[OK] Removidos ${allProducts.length} produtos.`);

  // 5. Remover Categorias
  const allCategories = await db.orm.public.Categoria.all();
  for (const cat of allCategories) {
    await db.orm.public.Categoria.where({ id: cat.id }).delete();
  }
  console.log(`[OK] Removidas ${allCategories.length} categorias.`);

  // 6. Remover Utilizadores de teste (preservar admin@tkvendas.dev e atendente@tkvendas.dev)
  const allUsers = await db.orm.public.Utilizador.all();
  let usersRemoved = 0;
  for (const u of allUsers) {
    if (u.email !== 'admin@tkvendas.dev' && u.email !== 'atendente@tkvendas.dev') {
      await db.orm.public.Utilizador.where({ id: u.id }).delete();
      usersRemoved++;
    }
  }
  console.log(`[OK] Removidos ${usersRemoved} utilizadores de teste.`);

  // 7. Validação do Estado Final
  const finalCategories = await db.orm.public.Categoria.all();
  const finalProducts = await db.orm.public.Produto.all();
  const finalSales = await db.orm.public.Venda.all();
  const finalItems = await db.orm.public.ItemVenda.all();
  const finalMovements = await db.orm.public.MovimentoStock.all();
  const finalUsers = await db.orm.public.Utilizador.all();

  console.log('\n=== ESTADO FINAL APÓS LIMPEZA ===');
  console.log(`Categorias: ${finalCategories.length} (Esperado: 0)`);
  console.log(`Produtos: ${finalProducts.length} (Esperado: 0)`);
  console.log(`Vendas: ${finalSales.length} (Esperado: 0)`);
  console.log(`ItensVenda: ${finalItems.length} (Esperado: 0)`);
  console.log(`MovimentosStock: ${finalMovements.length} (Esperado: 0)`);
  console.log(`Utilizadores Preservados (${finalUsers.length}):`);
  for (const u of finalUsers) {
    console.log(`  - [ID ${u.id}] ${u.nome} (${u.email}) [${u.perfil}] - Activo: ${u.activo}`);
  }

  const isClean =
    finalCategories.length === 0 &&
    finalProducts.length === 0 &&
    finalSales.length === 0 &&
    finalItems.length === 0 &&
    finalMovements.length === 0 &&
    finalUsers.length === 2;

  if (isClean) {
    console.log('\n>>> BASE DE DADOS TOTALMENTE LIMPA E PRONTA PARA TESTES REAIS <<<\n');
  } else {
    console.error('\n>>> AVISO: A base não atingiu o estado esperado de limpeza! <<<\n');
  }
}

cleanTestData().catch((err) => {
  console.error('Erro ao executar limpeza:', err);
  process.exit(1);
});
