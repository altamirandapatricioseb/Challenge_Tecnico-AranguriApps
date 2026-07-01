# Base de datos — InventFlow

Todo el esquema de la base de datos está consolidado en un único archivo:
[`migrations/schema.sql`](./migrations/schema.sql).

## Cómo levantar la base desde cero

1. Abrí el **SQL Editor** de Supabase en tu proyecto.
2. Copiá el contenido completo de `migrations/schema.sql` y ejecutalo.

Eso es todo. El archivo crea, en orden, las funciones, tablas, triggers,
políticas de seguridad, vistas y datos de ejemplo. Está pensado para correr de
una sola vez sobre un proyecto nuevo.

El script está dividido en secciones comentadas para facilitar su lectura:

| Sección | Contenido |
|---------|-----------|
| 1 y 2 | Funciones utilitarias, tablas, índices y triggers de stock. |
| 3 | Trigger que crea el perfil automáticamente al registrarse un usuario. |
| 4 | Row Level Security: función `get_my_role()` y políticas por rol. |
| 5 | Vistas de consulta (productos, stock bajo, movimientos, resúmenes). |
| 6 | Vista de administración de usuarios + función `get_user_email()`. |
| 7 | Vistas de conteo de productos por categoría y proveedor. |
| 8 | Datos de ejemplo (categorías, proveedores, productos y movimientos). |

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
trigger de creación de perfil).

## Notas de diseño

- **Integridad de stock**: el `current_stock` no se calcula en la app. El trigger
  `handle_stock_movement` lo actualiza ante cada movimiento, validando que haya
  stock suficiente en las salidas.
- **Movimientos inmutables**: `stock_movements` es un log de auditoría. Los triggers
  `block_movement_mutation` impiden UPDATE y DELETE sobre esa tabla.
- **Soft delete**: `products`, `suppliers`, `categories` y `profiles` (usuarios) usan
  `is_active` para baja lógica. Las vistas ocultan las referencias inactivas sin perder
  los ids. Un usuario dado de baja no puede iniciar sesión ni figura en el panel, pero su
  historial de movimientos (`created_by`) se conserva.
- **Seguridad en capas**: las políticas RLS validan los permisos en la base de datos,
  no solo en la aplicación (defensa en profundidad).
  