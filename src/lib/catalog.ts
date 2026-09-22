import 'server-only';

import { db } from '@/src/prisma/db';
import { categoryCreateSchema, categoryUpdateSchema, productCreateSchema, productUpdateSchema } from '@/src/lib/validators';

export type CategoryListItem = {
  id: number;
  nome: string;
  descricao: string | null;
  activo: boolean;
  criadoEm: string;
  produtosCount: number;
};

export type ProductListItem = {
  id: number;
  codigo: string;
  nome: string;
  categoriaId: number;
  categoriaNome: string;
  precoCompra: string;
  precoVenda: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  criadoEm: string;
};

export async function getCategories(options?: { search?: string; activo?: boolean | null }) {
  const searchText = (options?.search ?? '').trim();
  const allCategories = await db.orm.public.Categoria.select('id', 'nome', 'descricao', 'activo', 'criadoEm').orderBy((c) => c.nome.asc()).all();

  const filtered = allCategories.filter((category) => {
    const matchesSearch = !searchText || category.nome.toLowerCase().includes(searchText.toLowerCase());
    const matchesEstado = options?.activo === undefined || options.activo === null || category.activo === options.activo;
    return matchesSearch && matchesEstado;
  });

  const categoriesWithCount = await Promise.all(
    filtered.map(async (category) => {
      const productsCount = await db.orm.public.Produto.where({ categoriaId: category.id }).all().then((rows) => rows.length);

      return {
        ...category,
        produtosCount: productsCount,
      } satisfies CategoryListItem;
    }),
  );

  return categoriesWithCount;
}

export async function getCategoryById(id: number) {
  return db.orm.public.Categoria.where({ id }).first();
}

export async function createCategory(input: { nome: string; descricao?: string | null }) {
  const parsed = categoryCreateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const normalizedName = parsed.data.nome.trim();
  const existing = (await db.orm.public.Categoria.select('id', 'nome').all())
    .find((category) => String(category.nome).trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase());

  if (existing) {
    throw new Error('Já existe uma categoria com este nome.');
  }

  return db.orm.public.Categoria.create({
    nome: normalizedName,
    descricao: parsed.data.descricao ?? null,
    activo: true,
  });
}

export async function updateCategory(input: { id: number; nome: string; descricao?: string | null; activo: boolean }) {
  const parsed = categoryUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const existing = await db.orm.public.Categoria.where({ id: parsed.data.id }).first();

  if (!existing) {
    throw new Error('Categoria não encontrada.');
  }

  const duplicate = (await db.orm.public.Categoria.select('id', 'nome').all())
    .find((category) => category.id !== parsed.data.id && String(category.nome).trim().toLocaleLowerCase() === parsed.data.nome.trim().toLocaleLowerCase());

  if (duplicate) {
    throw new Error('Já existe uma categoria com este nome.');
  }

  return db.orm.public.Categoria.where({ id: parsed.data.id }).update({
    nome: parsed.data.nome.trim(),
    descricao: parsed.data.descricao ?? null,
    activo: parsed.data.activo,
  });
}

export async function setCategoryStatus(id: number, activo: boolean) {
  const category = await db.orm.public.Categoria.where({ id }).first();

  if (!category) {
    throw new Error('Categoria não encontrada.');
  }

  return db.orm.public.Categoria.where({ id }).update({ activo });
}

export async function getProducts(options?: { search?: string; categoriaId?: number | null; activo?: boolean | null }) {
  const searchText = (options?.search ?? '').trim();
  const allProducts = await db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'precoCompra', 'precoVenda', 'stockActual', 'stockMinimo', 'activo', 'criadoEm').orderBy((p) => p.nome.asc()).all();

  const products = await Promise.all(
    allProducts.map(async (product) => {
      const category = await db.orm.public.Categoria.where({ id: product.categoriaId }).first();

      return {
        ...product,
        categoriaNome: category?.nome ?? 'Sem categoria',
      } as ProductListItem;
    }),
  );

  return products.filter((product) => {
    const matchesSearch = !searchText || product.codigo.toLowerCase().includes(searchText.toLowerCase()) || product.nome.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategoria = options?.categoriaId === undefined || options.categoriaId === null || product.categoriaId === options.categoriaId;
    const matchesEstado = options?.activo === undefined || options.activo === null || product.activo === options.activo;
    return matchesSearch && matchesCategoria && matchesEstado;
  });
}

export async function getProductById(id: number) {
  return db.orm.public.Produto.where({ id }).first();
}

export async function createProduct(input: { codigo: string; nome: string; descricao?: string | null; categoriaId: number; precoCompra: number; precoVenda: number; stockActual: number; stockMinimo: number; activo?: boolean }) {
  const parsed = productCreateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const categoria = await db.orm.public.Categoria.where({ id: parsed.data.categoriaId }).first();

  if (!categoria) {
    throw new Error('A categoria seleccionada não existe.');
  }

  const existingCode = (await db.orm.public.Produto.select('id', 'codigo').all())
    .find((product) => String(product.codigo).trim().toLocaleLowerCase() === parsed.data.codigo.trim().toLocaleLowerCase());

  if (existingCode) {
    throw new Error('Já existe um produto com este código.');
  }

  if (parsed.data.precoVenda < parsed.data.precoCompra) {
    throw new Error('O preço de venda não pode ser inferior ao preço de compra.');
  }

  return db.orm.public.Produto.create({
    codigo: parsed.data.codigo.trim(),
    nome: parsed.data.nome.trim(),
    descricao: parsed.data.descricao ?? null,
    categoriaId: parsed.data.categoriaId,
    precoCompra: String(parsed.data.precoCompra),
    precoVenda: String(parsed.data.precoVenda),
    stockActual: parsed.data.stockActual,
    stockMinimo: parsed.data.stockMinimo,
    activo: parsed.data.activo ?? true,
  });
}

export async function updateProduct(input: { id: number; codigo: string; nome: string; descricao?: string | null; categoriaId: number; precoCompra: number; precoVenda: number; stockMinimo: number; activo: boolean }) {
  const parsed = productUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const existing = await db.orm.public.Produto.where({ id: parsed.data.id }).first();

  if (!existing) {
    throw new Error('Produto não encontrado.');
  }

  const categoria = await db.orm.public.Categoria.where({ id: parsed.data.categoriaId }).first();

  if (!categoria) {
    throw new Error('A categoria seleccionada não existe.');
  }

  const duplicateCode = (await db.orm.public.Produto.select('id', 'codigo').all())
    .find((product) => product.id !== parsed.data.id && String(product.codigo).trim().toLocaleLowerCase() === parsed.data.codigo.trim().toLocaleLowerCase());

  if (duplicateCode) {
    throw new Error('Já existe um produto com este código.');
  }

  if (parsed.data.precoVenda < parsed.data.precoCompra) {
    throw new Error('O preço de venda não pode ser inferior ao preço de compra.');
  }

  return db.orm.public.Produto.where({ id: parsed.data.id }).update({
    codigo: parsed.data.codigo.trim(),
    nome: parsed.data.nome.trim(),
    descricao: parsed.data.descricao ?? null,
    categoriaId: parsed.data.categoriaId,
    precoCompra: String(parsed.data.precoCompra),
    precoVenda: String(parsed.data.precoVenda),
    stockMinimo: parsed.data.stockMinimo,
    activo: parsed.data.activo,
  });
}

export async function setProductStatus(id: number, activo: boolean) {
  const product = await db.orm.public.Produto.where({ id }).first();

  if (!product) {
    throw new Error('Produto não encontrado.');
  }

  return db.orm.public.Produto.where({ id }).update({ activo });
}
