import { redirect } from 'next/navigation';
import { requireAuth } from '@/src/lib/auth';
import { DashboardLayout } from '@/src/components/layout/dashboard-layout';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth('/login');

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout user={{ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }}>
      {children}
    </DashboardLayout>
  );
}
