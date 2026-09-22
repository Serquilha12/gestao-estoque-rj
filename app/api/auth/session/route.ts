import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/src/lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      activo: user.activo,
    },
  });
}
