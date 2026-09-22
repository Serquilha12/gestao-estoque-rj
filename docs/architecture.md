# Architecture

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL 18
- Prisma 8 contract-based ORM

## Structure

- `app/` contains the Next.js application entry points and route handlers.
- `src/prisma/` contains the contract source, emitted artifacts, and the server-only DB runtime.
- `docs/` contains implementation notes for the current phase.

## Sales flow

The sales flow is exposed through `/api/vendas` and is available to both `ATENDENTE` and `ADMINISTRADOR` after server-side session validation. The server recalculates prices and totals from active PostgreSQL products; client totals are only presentation data.

Sale creation runs inside the Prisma 8 PostgreSQL transaction API. Each stock decrement is a conditional SQL update (`stockActual >= quantidade`) inside the same transaction, so a failed item rolls back the sale and all previous stock changes.

## Phase 2 scope

This project currently focuses on the technical foundation only: database connectivity, Prisma 8 runtime configuration, and server-side access control.
