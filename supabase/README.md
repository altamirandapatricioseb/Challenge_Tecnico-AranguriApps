# Base de datos — InventFlow

Scripts SQL para levantar la base de datos completa en Supabase (PostgreSQL).
Todo lo necesario está en la carpeta [`migrations/`](./migrations), numerado en
orden de ejecución.

## Cómo levantar la base desde cero

Ejecutar los scripts de `migrations/` **en orden numérico** en el SQL Editor de
Supabase, uno por uno:

| # | Archivo | Qué hace |
|---|---------|----------|
| 001 | `001_schema.sql` | Tablas, índices y triggers (stock, inmutabilidad de movimientos, `updated_at`). |
| 002 | `002_auth_trigger.sql` | Trigger que crea el perfil automáticamente al registrarse un usuario. |
| 003 | `003_rls.sql` | Row Level Security: función `get_my_role()` y políticas por rol. |
| 004 | `004_views.sql` | Vistas para consultas frecuentes (productos, movimientos, KPIs, etc.). |
| 005 | `005_admin_users_view.sql` | Vista de administración de usuarios + función `get_user_email()`. |
| 006 | `006_seed.sql` | Datos de ejemplo (categorías, proveedores, productos y movimientos). |

> El orden importa: cada script asume que los anteriores ya se ejecutaron.
> Por ejemplo, las vistas (004) dependen de las tablas (001), y el seed (006)
> dispara los triggers de stock definidos en 001.

## Usuarios de prueba

Los usuarios **no** se crean por SQL (viven en `auth.users`, gestionada por
Supabase Auth). Se crean registrándose desde la app (`/register`) y luego se
ajusta el rol con SQL:

```sql
-- Promover un usuario a manager
UPDATE profiles SET role = 'manager'
WHERE id = (SELECT id FROM auth.users WHERE email = 'manager@email.com');

-- Promover un usuario a admin
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@email.com');
```

El usuario que se registra queda con rol `viewer` por defecto (lo asigna el
trigger de la migración 002).

## Notas de diseño

- **Integridad de stock**: el `current_stock` no se calcula en la app. El trigger
  `handle_stock_movement` lo actualiza ante cada movimiento, validando que haya
  stock suficiente en las salidas.
- **Movimientos inmutables**: `stock_movements` es un log de auditoría. Los triggers
  `block_movement_mutation` impiden UPDATE y DELETE sobre esa tabla.
- **Soft delete**: `products`, `suppliers` y `categories` usan `is_active` para baja
  lógica. Las vistas ocultan las referencias inactivas sin perder los ids.
- **Seguridad en capas**: las políticas RLS validan los permisos en la base de datos,
  no solo en la aplicación (defensa en profundidad).
