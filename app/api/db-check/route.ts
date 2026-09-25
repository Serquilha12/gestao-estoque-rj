import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';

export async function GET() {
  // 1. Tentar primeiro via Prisma ORM Contract
  try {
    const [utilizadores, categorias, produtos] = await Promise.all([
      db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil').all(),
      db.orm.public.Categoria.select('id', 'nome').all(),
      db.orm.public.Produto.select('id', 'nome', 'categoriaId').all(),
    ]);

    return NextResponse.json({
      ok: true,
      driver: 'prisma',
      utilizadores: utilizadores.length,
      categorias: categorias.length,
      produtos: produtos.length,
      sample: {
        utilizadores: utilizadores.slice(0, 3),
        categorias: categorias.slice(0, 3),
        produtos: produtos.slice(0, 3),
      },
    });
  } catch (prismaError) {
    // 2. Fallback para Supabase REST (usado no Vercel quando conexão direta PG/Pooler falha)
    try {
      const [uRes, cRes, pRes] = await Promise.all([
        supabaseAdmin.from('Utilizador').select('id, nome, email, perfil'),
        supabaseAdmin.from('Categoria').select('id, nome'),
        supabaseAdmin.from('Produto').select('id, nome, categoriaId'),
      ]);

      const utilizadores = uRes.data ?? [];
      const categorias = cRes.data ?? [];
      const produtos = pRes.data ?? [];

      return NextResponse.json({
        ok: true,
        driver: 'supabase-rest',
        utilizadores: utilizadores.length,
        categorias: categorias.length,
        produtos: produtos.length,
        sample: {
          utilizadores: utilizadores.slice(0, 3),
          categorias: categorias.slice(0, 3),
          produtos: produtos.slice(0, 3),
        },
        prismaWarning: prismaError instanceof Error ? prismaError.message : String(prismaError),
      });
    } catch (supabaseError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Falha ao ligar à base de dados (Prisma e Supabase REST falharam).',
          prismaError: prismaError instanceof Error ? prismaError.message : String(prismaError),
          supabaseError: supabaseError instanceof Error ? supabaseError.message : String(supabaseError),
        },
        { status: 500 }
      );
    }
  }
}
