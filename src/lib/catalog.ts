import 'server-only';

import { db } from '@/src/prisma/db';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
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
  let allCategories: Array<{ id: number; nome: string; descricao: string | null; activo: boolean; criadoEm: string }> = [];

  try {
    allCategories = await db.orm.public.Categoria.select('id', 'nome', 'descricao', 'activo', 'criadoEm').orderBy((c) => c.nome.asc()).all();
  } catch {
    try {
      const { data } = await supabaseAdmin.from('Categoria').select('id, nome, descricao, activo, criadoEm').order('nome', { ascending: true });
      allCategories = (data ?? []).map((c) => ({
        id: Number(c.id),
        nome: String(c.nome),
        descricao: c.descricao ? String(c.descricao) : null,
        activo: Boolean(c.activo),
        criadoEm: String(c.criadoEm),
      }));
    } catch {
      allCategories = [];
    }
  }

  const filtered = allCategories.filter((category) => {
    const matchesSearch = !searchText || category.nome.toLowerCase().includes(searchText.toLowerCase());
    const matchesEstado = options?.activo === undefined || options.activo === null || category.activo === options.activo;
    return matchesSearch && matchesEstado;
  });

  return filtered.map((category) => ({
    ...category,
    produtosCount: 0,
  } satisfies CategoryListItem));
}

export async function getCategoryById(id: number) {
  try {
    const cat = await db.orm.public.Categoria.where({ id }).first();
    if (cat) return cat;
  } catch {
    // fallback
  }

  try {
    const { data } = await supabaseAdmin.from('Categoria').select('*').eq('id', id).maybeSingle();
    if (data) {
      return {
        id: Number(data.id),
        nome: String(data.nome),
        descricao: data.descricao ? String(data.descricao) : null,
        activo: Boolean(data.activo),
        criadoEm: String(data.criadoEm),
        actualizadoEm: String(data.actualizadoEm),
      };
    }
  } catch {
    // fallback
  }

  return null;
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
  let allProducts: Array<{ id: number; codigo: string; nome: string; categoriaId: number; precoCompra: string; precoVenda: string; stockActual: number; stockMinimo: number; activo: boolean; criadoEm: string }> = [];
  let allCategories: Array<{ id: number; nome: string }> = [];

  try {
    [allProducts, allCategories] = await Promise.all([
      db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'precoCompra', 'precoVenda', 'stockActual', 'stockMinimo', 'activo', 'criadoEm').orderBy((p) => p.nome.asc()).all(),
      db.orm.public.Categoria.select('id', 'nome').all(),
    ]);
  } catch {
    try {
      const [pRes, cRes] = await Promise.all([
        supabaseAdmin.from('Produto').select('id, codigo, nome, categoriaId, precoCompra, precoVenda, stockActual, stockMinimo, activo, criadoEm').order('nome', { ascending: true }),
        supabaseAdmin.from('Categoria').select('id, nome'),
      ]);
      allProducts = (pRes.data ?? []).map((p) => ({
        id: Number(p.id),
        codigo: String(p.codigo),
        nome: String(p.nome),
        categoriaId: Number(p.categoriaId),
        precoCompra: String(p.precoCompra),
        precoVenda: String(p.precoVenda),
        stockActual: Number(p.stockActual),
        stockMinimo: Number(p.stockMinimo),
        activo: Boolean(p.activo),
        criadoEm: String(p.criadoEm),
      }));
      allCategories = (cRes.data ?? []).map((c) => ({
        id: Number(c.id),
        nome: String(c.nome),
      }));
    } catch {
      allProducts = [];
      allCategories = [];
    }
  }

  const categoryMap = new Map(allCategories.map((c) => [c.id, c.nome]));

  const products: ProductListItem[] = allProducts.map((product) => ({
    ...product,
    categoriaNome: categoryMap.get(product.categoriaId) ?? 'Sem categoria',
  }));

  return products.filter((product) => {
    const matchesSearch = !searchText || product.codigo.toLowerCase().includes(searchText.toLowerCase()) || product.nome.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategoria = options?.categoriaId === undefined || options.categoriaId === null || product.categoriaId === options.categoriaId;
    const matchesEstado = options?.activo === undefined || options.activo === null || product.activo === options.activo;
    return matchesSearch && matchesCategoria && matchesEstado;
  });
}

export async function getProductById(id: number) {
  try {
    const prod = await db.orm.public.Produto.where({ id }).first();
    if (prod) return prod;
  } catch {
    // fallback
  }

  try {
    const { data } = await supabaseAdmin.from('Produto').select('*').eq('id', id).maybeSingle();
    if (data) {
      return {
        id: Number(data.id),
        codigo: String(data.codigo),
        nome: String(data.nome),
        descricao: data.descricao ? String(data.descricao) : null,
        categoriaId: Number(data.categoriaId),
        precoCompra: String(data.precoCompra),
        precoVenda: String(data.precoVenda),
        stockActual: Number(data.stockActual),
        stockMinimo: Number(data.stockMinimo),
        activo: Boolean(data.activo),
        criadoEm: String(data.criadoEm),
        actualizadoEm: String(data.actualizadoEm),
      };
    }
  } catch {
    // fallback
  }

  return null;
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
