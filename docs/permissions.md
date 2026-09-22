# Permissions

## Roles

- `ADMINISTRADOR`
- `ATENDENTE`

No additional roles are defined.

## Matrix

| Role | Login | Admin area | User management | Profile | Change own password |
| --- | --- | --- | --- | --- | --- |
| ADMINISTRADOR | Yes | Yes | Yes | Yes | Yes |
| ATENDENTE | Yes | No | No | Yes | Yes |

## Rules

- Only `ADMINISTRADOR` can access the admin area and manage users.
- `ATENDENTE` can access the operational area and view/update its own profile.
- No user can change or remove the last active `ADMINISTRADOR`.
- A disabled user cannot authenticate.
