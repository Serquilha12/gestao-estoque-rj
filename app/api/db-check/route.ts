import { NextResponse } from 'next/server';
import { db } from '../../../src/prisma/db';

export async function GET() {
  const [utilizadores, categorias, produtos] = await Promise.all([
    db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil').all(),
    db.orm.public.Categoria.select('id', 'nome').all(),
    db.orm.public.Produto.select('id', 'nome', 'categoriaId').all(),
  ]);

  return NextResponse.json({
    ok: true,
    utilizadores: utilizadores.length,
    categorias: categorias.length,
    produtos: produtos.length,
    sample: {
      utilizadores: utilizadores.slice(0, 3),
      categorias: categorias.slice(0, 3),
      produtos: produtos.slice(0, 3),
    },
  });
}
