import 'server-only';

import { db, canUsePrisma, reportPrismaSuccess, reportPrismaFailure } from '@/src/prisma/db';
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

  if (canUsePrisma()) {
    try {
      allCategories = await db.orm.public.Categoria.select('id', 'nome', 'descricao', 'activo', 'criadoEm').orderBy((c) => c.nome.asc()).all();
      reportPrismaSuccess();
    } catch (err) {
      reportPrismaFailure(err);
    }
  }

  if (allCategories.length === 0 && !canUsePrisma()) {
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

  try {
    const existing = (await db.orm.public.Categoria.select('id', 'nome').all())
      .find((category) => String(category.nome).trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase());

    if (existing) {
      throw new Error('Já existe uma categoria com este nome.');
    }

    return await db.orm.public.Categoria.create({
      nome: normalizedName,
      descricao: parsed.data.descricao ?? null,
      activo: true,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Já existe')) {
      throw err;
    }

    // Fallback Supabase REST
    const { data: existingData } = await supabaseAdmin
      .from('Categoria')
      .select('id, nome')
      .ilike('nome', normalizedName);

    if (existingData && existingData.length > 0) {
      throw new Error('Já existe uma categoria com este nome.');
    }

    const { data, error } = await supabaseAdmin
      .from('Categoria')
      .insert({
        nome: normalizedName,
        descricao: parsed.data.descricao ?? null,
        activo: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao criar categoria.');
    }

    return {
      id: Number(data.id),
      nome: String(data.nome),
      descricao: data.descricao ? String(data.descricao) : null,
      activo: Boolean(data.activo),
      criadoEm: String(data.criadoEm),
    };
  }
}

export async function updateCategory(input: { id: number; nome: string; descricao?: string | null; activo: boolean }) {
  const parsed = categoryUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const normalizedName = parsed.data.nome.trim();

  try {
    const existing = await db.orm.public.Categoria.where({ id: parsed.data.id }).first();

    if (!existing) {
      throw new Error('Categoria não encontrada.');
    }

    const duplicate = (await db.orm.public.Categoria.select('id', 'nome').all())
      .find((category) => category.id !== parsed.data.id && String(category.nome).trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase());

    if (duplicate) {
      throw new Error('Já existe uma categoria com este nome.');
    }

    return await db.orm.public.Categoria.where({ id: parsed.data.id }).update({
      nome: normalizedName,
      descricao: parsed.data.descricao ?? null,
      activo: parsed.data.activo,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Já existe') || err.message.includes('não encontrada'))) {
      throw err;
    }

    // Fallback Supabase REST
    const { data: existing } = await supabaseAdmin.from('Categoria').select('id').eq('id', parsed.data.id).maybeSingle();
    if (!existing) {
      throw new Error('Categoria não encontrada.');
    }

    const { data: duplicates } = await supabaseAdmin.from('Categoria').select('id, nome').ilike('nome', normalizedName);
    if (duplicates && duplicates.some((c) => Number(c.id) !== parsed.data.id)) {
      throw new Error('Já existe uma categoria com este nome.');
    }

    const { data, error } = await supabaseAdmin
      .from('Categoria')
      .update({
        nome: normalizedName,
        descricao: parsed.data.descricao ?? null,
        activo: parsed.data.activo,
      })
      .eq('id', parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao actualizar categoria.');
    }

    return {
      id: Number(data.id),
      nome: String(data.nome),
      descricao: data.descricao ? String(data.descricao) : null,
      activo: Boolean(data.activo),
    };
  }
}

export async function setCategoryStatus(id: number, activo: boolean) {
  try {
    const category = await db.orm.public.Categoria.where({ id }).first();

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return await db.orm.public.Categoria.where({ id }).update({ activo });
  } catch (err) {
    if (err instanceof Error && err.message.includes('não encontrada')) {
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('Categoria')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Categoria não encontrada.');
    }

    return data;
  }
}

export async function getProducts(options?: { search?: string; categoriaId?: number | null; activo?: boolean | null }) {
  const searchText = (options?.search ?? '').trim();
  let allProducts: Array<{ id: number; codigo: string; nome: string; categoriaId: number; precoCompra: string; precoVenda: string; stockActual: number; stockMinimo: number; activo: boolean; criadoEm: string }> = [];
  let allCategories: Array<{ id: number; nome: string }> = [];

  if (canUsePrisma()) {
    try {
      [allProducts, allCategories] = await Promise.all([
        db.orm.public.Produto.select('id', 'codigo', 'nome', 'categoriaId', 'precoCompra', 'precoVenda', 'stockActual', 'stockMinimo', 'activo', 'criadoEm').orderBy((p) => p.nome.asc()).all(),
        db.orm.public.Categoria.select('id', 'nome').all(),
      ]);
      reportPrismaSuccess();
    } catch (err) {
      reportPrismaFailure(err);
    }
  }

  if (allProducts.length === 0 && !canUsePrisma()) {
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

  const normalizedCode = parsed.data.codigo.trim();
  const normalizedName = parsed.data.nome.trim();

  if (parsed.data.precoVenda < parsed.data.precoCompra) {
    throw new Error('O preço de venda não pode ser inferior ao preço de compra.');
  }

  // 1. Tentar primeiro via Prisma ORM
  try {
    const categoria = await db.orm.public.Categoria.where({ id: parsed.data.categoriaId }).first();

    if (!categoria) {
      throw new Error('A categoria seleccionada não existe.');
    }

    const existingCode = (await db.orm.public.Produto.select('id', 'codigo').all())
      .find((product) => String(product.codigo).trim().toLocaleLowerCase() === normalizedCode.toLocaleLowerCase());

    if (existingCode) {
      throw new Error('Já existe um produto com este código.');
    }

    return await db.orm.public.Produto.create({
      codigo: normalizedCode,
      nome: normalizedName,
      descricao: parsed.data.descricao ?? null,
      categoriaId: parsed.data.categoriaId,
      precoCompra: String(parsed.data.precoCompra),
      precoVenda: String(parsed.data.precoVenda),
      stockActual: parsed.data.stockActual,
      stockMinimo: parsed.data.stockMinimo,
      activo: parsed.data.activo ?? true,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Já existe') || err.message.includes('não existe') || err.message.includes('preço de venda'))) {
      throw err;
    }

    // 2. Fallback Supabase REST
    const { data: catData } = await supabaseAdmin
      .from('Categoria')
      .select('id')
      .eq('id', parsed.data.categoriaId)
      .maybeSingle();

    if (!catData) {
      throw new Error('A categoria seleccionada não existe.');
    }

    const { data: codeData } = await supabaseAdmin
      .from('Produto')
      .select('id, codigo')
      .ilike('codigo', normalizedCode);

    if (codeData && codeData.length > 0) {
      throw new Error('Já existe um produto com este código.');
    }

    const { data, error } = await supabaseAdmin
      .from('Produto')
      .insert({
        codigo: normalizedCode,
        nome: normalizedName,
        descricao: parsed.data.descricao ?? null,
        categoriaId: parsed.data.categoriaId,
        precoCompra: parsed.data.precoCompra,
        precoVenda: parsed.data.precoVenda,
        stockActual: parsed.data.stockActual,
        stockMinimo: parsed.data.stockMinimo,
        activo: parsed.data.activo ?? true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Não foi possível guardar o produto.');
    }

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
    };
  }
}

export async function updateProduct(input: { id: number; codigo: string; nome: string; descricao?: string | null; categoriaId: number; precoCompra: number; precoVenda: number; stockMinimo: number; activo: boolean }) {
  const parsed = productUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const normalizedCode = parsed.data.codigo.trim();
  const normalizedName = parsed.data.nome.trim();

  if (parsed.data.precoVenda < parsed.data.precoCompra) {
    throw new Error('O preço de venda não pode ser inferior ao preço de compra.');
  }

  // 1. Tentar primeiro via Prisma ORM
  try {
    const existing = await db.orm.public.Produto.where({ id: parsed.data.id }).first();

    if (!existing) {
      throw new Error('Produto não encontrado.');
    }

    const categoria = await db.orm.public.Categoria.where({ id: parsed.data.categoriaId }).first();

    if (!categoria) {
      throw new Error('A categoria seleccionada não existe.');
    }

    const duplicateCode = (await db.orm.public.Produto.select('id', 'codigo').all())
      .find((product) => product.id !== parsed.data.id && String(product.codigo).trim().toLocaleLowerCase() === normalizedCode.toLocaleLowerCase());

    if (duplicateCode) {
      throw new Error('Já existe um produto com este código.');
    }

    return await db.orm.public.Produto.where({ id: parsed.data.id }).update({
      codigo: normalizedCode,
      nome: normalizedName,
      descricao: parsed.data.descricao ?? null,
      categoriaId: parsed.data.categoriaId,
      precoCompra: String(parsed.data.precoCompra),
      precoVenda: String(parsed.data.precoVenda),
      stockMinimo: parsed.data.stockMinimo,
      activo: parsed.data.activo,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Já existe') || err.message.includes('não encontrado') || err.message.includes('não existe') || err.message.includes('preço de venda'))) {
      throw err;
    }

    // 2. Fallback Supabase REST
    const { data: existing } = await supabaseAdmin.from('Produto').select('id').eq('id', parsed.data.id).maybeSingle();
    if (!existing) {
      throw new Error('Produto não encontrado.');
    }

    const { data: catData } = await supabaseAdmin.from('Categoria').select('id').eq('id', parsed.data.categoriaId).maybeSingle();
    if (!catData) {
      throw new Error('A categoria seleccionada não existe.');
    }

    const { data: duplicates } = await supabaseAdmin.from('Produto').select('id, codigo').ilike('codigo', normalizedCode);
    if (duplicates && duplicates.some((p) => Number(p.id) !== parsed.data.id)) {
      throw new Error('Já existe um produto com este código.');
    }

    const { data, error } = await supabaseAdmin
      .from('Produto')
      .update({
        codigo: normalizedCode,
        nome: normalizedName,
        descricao: parsed.data.descricao ?? null,
        categoriaId: parsed.data.categoriaId,
        precoCompra: parsed.data.precoCompra,
        precoVenda: parsed.data.precoVenda,
        stockMinimo: parsed.data.stockMinimo,
        activo: parsed.data.activo,
      })
      .eq('id', parsed.data.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Não foi possível actualizar o produto.');
    }

    return {
      id: Number(data.id),
      codigo: String(data.codigo),
      nome: String(data.nome),
      descricao: data.descricao ? String(data.descricao) : null,
      categoriaId: Number(data.categoriaId),
      precoCompra: String(data.precoCompra),
      precoVenda: String(data.precoVenda),
      stockMinimo: Number(data.stockMinimo),
      activo: Boolean(data.activo),
    };
  }
}

export async function setProductStatus(id: number, activo: boolean) {
  try {
    const product = await db.orm.public.Produto.where({ id }).first();

    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    return await db.orm.public.Produto.where({ id }).update({ activo });
  } catch (err) {
    if (err instanceof Error && err.message.includes('não encontrado')) {
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('Produto')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Produto não encontrado.');
    }

    return data;
  }
}
