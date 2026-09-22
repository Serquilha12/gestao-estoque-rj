# Security

## Authentication solution

This project uses a server-side JWT session stored in an `HttpOnly` cookie. The JWT includes only the minimal user identity needed for authorization: `id`, `nome`, `email`, `perfil`, and `activo`.

## Password handling

Passwords are stored as secure hashes using `bcryptjs` and never exposed to the frontend or returned by API responses.

## Server-side authorization

Access checks are enforced in server code using session validation and role checks. UI-level checks are only for UX; they are never treated as the source of authorization.

## Cookie settings

The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production. It is invalidated on logout.
