import { redirect } from 'next/navigation';
import { getCurrentUser, requireRole } from '@/src/lib/auth';
import { getUsers } from '@/src/lib/users';
import { UsersManagement } from './users-management';

export default async function AdminUsersPage() {
  const user = await requireRole('ADMINISTRADOR', '/login');
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.perfil !== 'ADMINISTRADOR') {
    redirect('/login');
  }

  const users = await getUsers();

  return (
    <UsersManagement
      users={users.map((u) => ({
        id: Number(u.id),
        nome: String(u.nome),
        email: String(u.email),
        perfil: u.perfil as 'ADMINISTRADOR' | 'ATENDENTE',
        activo: Boolean(u.activo),
        criadoEm: String(u.criadoEm),
      }))}
      currentUserId={user.id}
    />
  );
}
