# Development rules

- Keep Prisma 8 contract-based access only; do not use the legacy Prisma Client API.
- Keep `DATABASE_URL` server-side; never expose it to the client.
- Do not introduce additional roles or business modules in this phase.
- Prefer server-side route handlers or server components for DB access.
- Maintain the current architecture and do not swap the backing database.
