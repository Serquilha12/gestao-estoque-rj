import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';
import { createProduct, getProducts, updateProduct } from '@/src/lib/catalog';
import { productCreateSchema, productUpdateSchema } from '@/src/lib/validators';

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json().catch(() => ({}));
  }

  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function formProductBody(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ...body,
    id: body.id === undefined ? undefined : Number(body.id),
    categoriaId: Number(body.categoriaId),
    precoCompra: body.precoCompra,
    precoVenda: body.precoVenda,
    stockActual: body.stockActual,
    stockMinimo: body.stockMinimo,
    activo: body.activo === undefined ? true : body.activo === true || body.activo === 'true',
  };
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const categoriaParam = searchParams.get('categoriaId');
  const estado = searchParams.get('estado');
  const produtos = await getProducts({
    search: searchParams.get('search') ?? '',
    categoriaId: categoriaParam ? Number(categoriaParam) : null,
    activo: estado === 'activo' ? true : estado === 'inactivo' ? false : null,
  });

  return NextResponse.json({ produtos });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = formProductBody(await readBody(request) as Record<string, unknown>);
  const isUpdate = body.id !== undefined;
  try {
    if (!isUpdate) {
      const existingProducts = await getProducts({ search: String(body.codigo) });
      if (existingProducts.some((product) => product.codigo.trim().toLocaleLowerCase() === String(body.codigo).trim().toLocaleLowerCase())) {
        return NextResponse.json({ error: 'Já existe um produto com este código.' }, { status: 409 });
      }
    }

    const product = isUpdate
      ? await updateProduct(productUpdateSchema.parse(body))
      : await createProduct(productCreateSchema.parse(body));

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.redirect(new URL('/app/admin/produtos', request.url), 303);
    }

    return NextResponse.json({ ok: true, produto: product }, { status: isUpdate ? 200 : 201 });
  } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados do produto inválidos.' }, { status: 400 });
    }
    const duplicate = /já existe|unique|duplicate|únic/i.test(message);
    const publicMessage = duplicate
      ? 'Já existe um produto com este código.'
      : /produto|código|categoria|preço|stock/i.test(message) ? message : 'Não foi possível guardar o produto.';
    const status = duplicate ? 409 : message.includes('não encontrado') || message.includes('não existe') ? 404 : 400;
    return NextResponse.json({ error: publicMessage }, { status });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
