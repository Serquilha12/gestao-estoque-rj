import { db } from './db';

async function main() {
  const [utilizadores, categorias, produtos] = await Promise.all([
    db.orm.public.Utilizador.select('id', 'nome', 'email', 'perfil').all(),
    db.orm.public.Categoria.select('id', 'nome').all(),
    db.orm.public.Produto.select('id', 'nome', 'categoriaId').all(),
  ]);

  console.log('Utilizadores:', utilizadores);
  console.log('Categorias:', categorias);
  console.log('Produtos:', produtos);
}

main().catch((erro) => {
  console.error('Erro ao consultar a base de dados:', erro);
  process.exit(1);
});