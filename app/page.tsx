import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/src/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  redirect(user.perfil === 'ADMINISTRADOR' ? '/app/admin' : '/app/atendente');
}
