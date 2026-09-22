import bcrypt from 'bcryptjs';

import { db } from '../src/prisma/db';

async function main() {
  const users = [
    {
      nome: 'Admin Dev',
      email: 'admin@tkvendas.dev',
      password: 'Admin123!',
      perfil: 'ADMINISTRADOR' as const,
    },
    {
      nome: 'Atendente Dev',
      email: 'atendente@tkvendas.dev',
      password: 'Atendente123!',
      perfil: 'ATENDENTE' as const,
    },
  ];

  for (const user of users) {
    const existing = await db.orm.public.Utilizador.where({ email: user.email }).first();

    if (existing) {
      console.log(`exists ${user.email}`);
      continue;
    }

    await db.orm.public.Utilizador.create({
      nome: user.nome,
      email: user.email,
      palavraPasse: await bcrypt.hash(user.password, 12),
      perfil: user.perfil,
      activo: true,
    });

    console.log(`created ${user.email}`);
  }
}

main().catch((error) => {
  console.error('Seed auth error:', error);
  process.exit(1);
});
