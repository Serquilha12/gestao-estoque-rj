import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../src/prisma/contract.d';
import contractJson from '../src/prisma/contract.json' with { type: 'json' };

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const db = postgres<Contract>({ contractJson, url: databaseUrl });

async function main() {
  const users = await db.orm.public.Utilizador.all();
  const categories = await db.orm.public.Categoria.all();
  const products = await db.orm.public.Produto.all();
  const sales = await db.orm.public.Venda.all();
  const items = await db.orm.public.ItemVenda.all();
  const movements = await db.orm.public.MovimentoStock.all();

  console.log('=== ESTADO ACTUAL DA BASE DE DADOS ===');
  console.log(`Utilizadores (${users.length}):`, users.map((u) => ({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil })));
  console.log(`Categorias (${categories.length}):`, categories.map((c) => ({ id: c.id, nome: c.nome })));
  console.log(`Produtos (${products.length}):`, products.map((p) => ({ id: p.id, codigo: p.codigo, nome: p.nome })));
  console.log(`Vendas (${sales.length}):`, sales.map((s) => ({ id: s.id, total: s.total })));
  console.log(`ItensVenda: ${items.length}`);
  console.log(`MovimentosStock: ${movements.length}`);
}

main().catch(console.error);
