# Database

## Runtime access

The database client is created in `src/prisma/db.ts` using Prisma 8's PostgreSQL runtime and the emitted contract.

- `DATABASE_URL` is read only on the server.
- The module is guarded with `server-only` to prevent accidental client-side imports.
- The contract is loaded from `src/prisma/contract.json`.

## Current models

- `Utilizador`
- `Categoria`
- `Produto`
- `Venda`
- `ItemVenda`

The `Categoria` to `Produto` relation is 1:N.

`Utilizador` to `Venda` is 1:N. `Venda` to `ItemVenda` is 1:N, and `ItemVenda` stores `precoUnitario` and `subtotal` snapshots so historical sales do not depend on later product price changes. Sale writes and conditional stock decrements are committed together through `db.transaction(...)`.
