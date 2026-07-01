-- ============================================================================
-- InventFlow — Esquema completo de base de datos (PostgreSQL / Supabase)
-- ============================================================================
--
-- Este archivo levanta la base de datos COMPLETA desde cero, en un solo script.
-- Refleja el estado final del esquema (no una secuencia de migraciones
-- incrementales): las tablas ya incluyen todas sus columnas, y las vistas y
-- funciones estan en su version definitiva.
--
-- Ejecutar entero en el SQL Editor de Supabase, sobre un proyecto nuevo.
--
-- Contenido:
--   1. Funciones utilitarias
--   2. Tablas (profiles, categories, suppliers, products, stock_movements)
--   3. Trigger de creacion automatica de perfil
--   4. Row Level Security (politicas por rol)
--   5. Vistas de consulta
--   6. Vista de administracion de usuarios
--   7. Vistas de conteo de productos por entidad
--   8. Datos de ejemplo (seed)
--
-- Notas de diseño:
--   - Integridad de stock en la base: el trigger handle_stock_movement mantiene
--     current_stock; nunca se calcula en la app.
--   - Movimientos inmutables: stock_movements no admite UPDATE ni DELETE.
--   - Soft delete: products, suppliers, categories y profiles usan is_active.
--   - Seguridad en capas: RLS valida permisos en la propia base de datos.
-- ============================================================================

-- ============================================================================
-- SECCION 1 y 2 — Funciones utilitarias, tablas, indices y triggers de stock
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: profiles (extiende auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('admin', 'manager', 'viewer')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,   -- soft delete de usuarios
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLA: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  categories_name_unique UNIQUE (name)
);

-- ============================================================
-- TABLA: suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  notes        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLA: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  sku           TEXT,
  description   TEXT,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_price    DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock     INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  unit          TEXT NOT NULL DEFAULT 'unidad',
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_sku_unique UNIQUE (sku)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLA: stock_movements (inmutable — solo INSERT)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type    TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment')),
  --quantity >= 0 para permitir ajustes a cero (conteo físico con stock agotado).
  -- La validación de > 0 para entry/exit se hace en el trigger handle_stock_movement(),
  quantity         INTEGER NOT NULL CHECK (quantity >= 0),
  reason           TEXT,
  notes            TEXT,
  unit_price       DECIMAL(12, 2) CHECK (unit_price >= 0),
  reference_number TEXT,   -- nro de factura, remito, etc.
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Sin updated_at: este registro es un log de auditoría inmutable
);

CREATE INDEX idx_movements_product    ON stock_movements(product_id);
CREATE INDEX idx_movements_type       ON stock_movements(movement_type);
CREATE INDEX idx_movements_created    ON stock_movements(created_at DESC);
CREATE INDEX idx_movements_created_by ON stock_movements(created_by);

-- ============================================================
-- TRIGGER: actualizar products.current_stock en cada movimiento
-- ============================================================
CREATE OR REPLACE FUNCTION handle_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- validar que entry/exit tengan quantity > 0.
  -- El adjustment puede ser 0 (conteo físico con stock agotado), por eso se excluye.
  IF NEW.movement_type IN ('entry', 'exit') AND NEW.quantity = 0 THEN
    RAISE EXCEPTION
      'La cantidad para movimientos de tipo entry o exit debe ser mayor a cero.'
      USING ERRCODE = 'P0003';
  END IF;

  -- Leer stock actual con lock para evitar race conditions
  SELECT current_stock INTO v_current_stock
  FROM products WHERE id = NEW.product_id FOR UPDATE;

  IF NEW.movement_type = 'entry' THEN
    UPDATE products
    SET current_stock = v_current_stock + NEW.quantity
    WHERE id = NEW.product_id;

  ELSIF NEW.movement_type = 'exit' THEN
    IF v_current_stock < NEW.quantity THEN
      RAISE EXCEPTION
        'Stock insuficiente para el producto. Disponible: %, Requerido: %',
        v_current_stock, NEW.quantity
        USING ERRCODE = 'P0001';
    END IF;
    UPDATE products
    SET current_stock = v_current_stock - NEW.quantity
    WHERE id = NEW.product_id;

  ELSIF NEW.movement_type = 'adjustment' THEN
    -- El adjustment setea el stock absoluto (conteo físico).
    -- Puede ser 0: significa que el conteo físico encontró cero unidades.
    UPDATE products
    SET current_stock = NEW.quantity
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_stock_movement_insert
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION handle_stock_movement();

-- ============================================================
-- TRIGGER: bloquear UPDATE y DELETE en stock_movements
-- ============================================================
CREATE OR REPLACE FUNCTION block_movement_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'Los movimientos de stock son inmutables. No se permite % en stock_movements.',
    TG_OP
    USING ERRCODE = 'P0002';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_movements
  BEFORE UPDATE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION block_movement_mutation();

CREATE TRIGGER no_delete_movements
  BEFORE DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION block_movement_mutation();

-- ============================================================================
-- SECCION 3 — Trigger: crear perfil automaticamente al registrarse un usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'viewer'   -- rol por defecto: solo lectura
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users 
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECCION 4 — Row Level Security (funcion get_my_role + politicas por rol)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABLA: profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: ver propio o admin ve todos"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "profiles: editar propio"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
  -- Un user no puede auto-promoverse de role

-- los admins necesitan poder cambiar el role de otros usuarios 
CREATE POLICY "profiles: admin puede actualizar cualquiera"
  ON profiles FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- ============================================================
-- TABLA: categories
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: todos pueden leer"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories: admin y manager pueden insertar"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "categories: admin y manager pueden actualizar"
  ON categories FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "categories: solo admin puede eliminar"
  ON categories FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- TABLA: suppliers
-- ============================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers: todos pueden leer"
  ON suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "suppliers: admin y manager pueden insertar"
  ON suppliers FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "suppliers: admin y manager pueden actualizar"
  ON suppliers FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "suppliers: solo admin puede eliminar"
  ON suppliers FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- ============================================================
-- TABLA: products
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: todos pueden leer"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "products: admin y manager pueden insertar"
  ON products FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY "products: admin y manager pueden actualizar"
  ON products FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'manager'));

-- Sin DELETE policy:  is_active = false (soft delete)

-- ============================================================
-- TABLA: stock_movements
-- ============================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movements: todos pueden leer"
  ON stock_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "movements: admin y manager pueden insertar"
  ON stock_movements FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- Sin UPDATE ni DELETE policies

-- ============================================================================
-- SECCION 5 — Vistas de consulta (productos, stock bajo, movimientos, resumenes)
-- ============================================================================

CREATE OR REPLACE VIEW products_with_details
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.description,
  p.unit_price,
  p.current_stock,
  p.min_stock,
  p.unit,
  p.image_url,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.category_id,
  -- Solo se muestra la categoria si esta activa (soft delete): si fue desactivada,
  -- el producto muestra null aunque conserve el category_id en la tabla products
  CASE WHEN c.is_active THEN c.name  ELSE NULL END AS category_name,
  CASE WHEN c.is_active THEN c.color ELSE NULL END AS category_color,
  p.supplier_id,
  -- Mismo criterio para el proveedor: si fue desactivado, no se muestra
  CASE WHEN s.is_active THEN s.name  ELSE NULL END AS supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers  s ON p.supplier_id  = s.id;

-- Vista: productos con stock bajo o en cero
CREATE OR REPLACE VIEW low_stock_products
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.current_stock,
  p.min_stock,
  p.unit,
  c.name  AS category_name,
  c.color AS category_color
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE
  AND p.current_stock <= p.min_stock
ORDER BY p.current_stock ASC;

-- Vista: movimientos con datos del producto
CREATE OR REPLACE VIEW movements_with_product
WITH (security_invoker = true)
AS
SELECT
  m.id,
  m.product_id,
  m.movement_type,
  m.quantity,
  m.reason,
  m.notes,
  m.unit_price,
  m.reference_number,
  m.created_by,
  m.created_at,
  p.name AS product_name,
  p.sku  AS product_sku,
  p.unit AS product_unit
FROM stock_movements m
JOIN products p ON m.product_id = p.id;

-- Vista: resumen de movimientos por día
CREATE OR REPLACE VIEW movement_daily_summary
WITH (security_invoker = true)
AS
SELECT
  DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS date,
  COUNT(*) FILTER (WHERE movement_type = 'entry')      AS entries,
  COUNT(*) FILTER (WHERE movement_type = 'exit')       AS exits,
  COUNT(*) FILTER (WHERE movement_type = 'adjustment') AS adjustments
FROM stock_movements
GROUP BY DATE(created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')
ORDER BY date DESC;

-- Vista: distribución de productos y valor de stock por categoría
CREATE OR REPLACE VIEW category_stock_summary
WITH (security_invoker = true)
AS
SELECT
  c.id            AS category_id,
  c.name          AS category_name,
  c.color         AS category_color,
  COUNT(p.id)     AS product_count,
  COALESCE(SUM(p.current_stock * p.unit_price), 0) AS stock_value
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
GROUP BY c.id, c.name, c.color
ORDER BY stock_value DESC;

-- ============================================================================
-- SECCION 6 — Vista de administracion de usuarios (+ funcion get_user_email)
-- ============================================================================

-- Funcion que devuelve el email de un usuario por su id.
-- SECURITY DEFINER: corre con permisos del owner, puede leer auth.users
-- (los usuarios autenticados no tienen permiso directo sobre esa tabla interna).
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = user_id
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vista de administracion de usuarios: combina profiles con el email.
-- Solo lista usuarios activos (is_active = true): los eliminados por soft delete
-- quedan ocultos del panel, sin opcion de reactivacion desde la interfaz.
CREATE OR REPLACE VIEW admin_users_overview
WITH (security_invoker = true)
AS
SELECT
  p.id,
  get_user_email(p.id) AS email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at
FROM profiles p
WHERE p.is_active = TRUE
ORDER BY p.created_at DESC;

-- ============================================================================
-- SECCION 7 — Vistas de conteo de productos por categoria y proveedor
-- ============================================================================

-- Vista: categorias activas con su cantidad de productos activos asociados.
-- El conteo se hace en la base; solo cuenta productos is_active = true.
CREATE OR REPLACE VIEW categories_with_counts
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.description,
  c.color,
  c.is_active,
  c.created_at,
  COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.description, c.color, c.is_active, c.created_at
ORDER BY c.name;

-- Vista: proveedores activos con su cantidad de productos activos asociados.
CREATE OR REPLACE VIEW suppliers_with_counts
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.name,
  s.contact_name,
  s.email,
  s.phone,
  s.address,
  s.notes,
  s.is_active,
  s.created_at,
  s.updated_at,
  COUNT(p.id) AS product_count
FROM suppliers s
LEFT JOIN products p ON p.supplier_id = s.id AND p.is_active = TRUE
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.contact_name, s.email, s.phone, s.address, s.notes, s.is_active, s.created_at, s.updated_at
ORDER BY s.name;

-- ============================================================================
-- SECCION 8 — Datos de ejemplo (seed)
-- ============================================================================

INSERT INTO categories (id, name, description, color) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Electrónica',  'Componentes y dispositivos electrónicos', '#6366f1'),
  ('11111111-0000-0000-0000-000000000002', 'Herramientas', 'Herramientas manuales y eléctricas',       '#f59e0b'),
  ('11111111-0000-0000-0000-000000000003', 'Insumos',      'Materiales consumibles y de oficina',      '#10b981'),
  ('11111111-0000-0000-0000-000000000004', 'Indumentaria', 'Ropa de trabajo y EPP',                    '#ec4899')
ON CONFLICT DO NOTHING;

-- ── Suppliers ─────────────────────────────────────────────────
INSERT INTO suppliers (id, name, contact_name, email, phone) VALUES
  ('22222222-0000-0000-0000-000000000001', 'TechDistrib SA', 'Marcelo Ruiz',  'marcelo@techdistrib.com.ar', '011-4523-7890'),
  ('22222222-0000-0000-0000-000000000002', 'HerraMax SRL',   'Ana González',  'ventas@herramax.com.ar',     '011-4712-3456'),
  ('22222222-0000-0000-0000-000000000003', 'Insumos Norte',  'Diego Peralta', 'diego@insumosnorte.com.ar',  '011-4891-2233')
ON CONFLICT DO NOTHING;

-- ── Products (current_stock arranca en 0 — lo construyen los movimientos) ──
INSERT INTO products (id, name, sku, category_id, supplier_id, unit_price, min_stock, unit) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Multímetro Digital UNI-T',    'ELC-001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',  8500.00,  5, 'unidad'),
  ('33333333-0000-0000-0000-000000000002', 'Cable UTP Cat6 (rollo 100m)', 'ELC-002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 12400.00,  5, 'rollo'),
  ('33333333-0000-0000-0000-000000000003', 'Soldador 40W Stayer',         'ELC-003', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',  4200.00,  3, 'unidad'),
  ('33333333-0000-0000-0000-000000000004', 'Taladro Percutor 1/2" Bosch', 'HRR-001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 42000.00,  3, 'unidad'),
  ('33333333-0000-0000-0000-000000000005', 'Amoladora Angular 115mm',     'HRR-002', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 18500.00,  4, 'unidad'),
  ('33333333-0000-0000-0000-000000000006', 'Juego Llaves Combinadas 12p', 'HRR-003', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002',  6800.00,  5, 'set'),
  ('33333333-0000-0000-0000-000000000007', 'Papel A4 (resma 500 hojas)',  'INS-001', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003',  3200.00, 10, 'resma'),
  ('33333333-0000-0000-0000-000000000008', 'Cinta de Embalaje (x6)',      'INS-002', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003',  1800.00, 10, 'pack'),
  ('33333333-0000-0000-0000-000000000009', 'Guantes de Nitrilo (caja)',   'IND-001', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003',  2900.00,  8, 'caja'),
  ('33333333-0000-0000-0000-000000000010', 'Casco Seguridad 3M',          'IND-002', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002',  5600.00,  5, 'unidad')
ON CONFLICT DO NOTHING;

-- ── Movimientos: ENTRADAS (suman stock) ───────────────────────
INSERT INTO stock_movements (product_id, movement_type, quantity, reason, reference_number, created_at) VALUES
  ('33333333-0000-0000-0000-000000000001', 'entry', 15, 'Compra inicial', 'REM-2025-001', NOW() - INTERVAL '12 days'),
  ('33333333-0000-0000-0000-000000000002', 'entry',  5, 'Compra inicial', 'REM-2025-002', NOW() - INTERVAL '12 days'),
  ('33333333-0000-0000-0000-000000000003', 'entry',  5, 'Compra inicial', 'REM-2025-003', NOW() - INTERVAL '11 days'),
  ('33333333-0000-0000-0000-000000000004', 'entry', 10, 'Compra inicial', 'REM-2025-004', NOW() - INTERVAL '11 days'),
  ('33333333-0000-0000-0000-000000000005', 'entry',  4, 'Compra inicial', 'REM-2025-005', NOW() - INTERVAL '10 days'),
  ('33333333-0000-0000-0000-000000000006', 'entry', 12, 'Compra inicial', 'REM-2025-006', NOW() - INTERVAL '10 days'),
  ('33333333-0000-0000-0000-000000000007', 'entry', 30, 'Compra insumos', 'REM-2025-007', NOW() - INTERVAL  '9 days'),
  ('33333333-0000-0000-0000-000000000008', 'entry',  8, 'Compra insumos', 'REM-2025-008', NOW() - INTERVAL  '9 days'),
  ('33333333-0000-0000-0000-000000000009', 'entry', 20, 'Compra EPP',     'REM-2025-009', NOW() - INTERVAL  '8 days'),
  ('33333333-0000-0000-0000-000000000010', 'entry',  5, 'Compra EPP',     'REM-2025-010', NOW() - INTERVAL  '8 days');

-- ── Movimientos: SALIDAS (restan stock) ───────────────────────
INSERT INTO stock_movements (product_id, movement_type, quantity, reason, reference_number, created_at) VALUES
  ('33333333-0000-0000-0000-000000000001', 'exit', 3, 'Entrega a obra Sur',   'REM-2025-045', NOW() - INTERVAL '5 days'),
  ('33333333-0000-0000-0000-000000000002', 'exit', 2, 'Entrega a obra Norte', 'REM-2025-046', NOW() - INTERVAL '5 days'),
  ('33333333-0000-0000-0000-000000000003', 'exit', 5, 'Entrega a obra Sur',   'REM-2025-047', NOW() - INTERVAL '4 days'),
  ('33333333-0000-0000-0000-000000000004', 'exit', 3, 'Préstamo a taller',    'REM-2025-048', NOW() - INTERVAL '4 days'),
  ('33333333-0000-0000-0000-000000000007', 'exit', 5, 'Consumo oficina',      NULL,           NOW() - INTERVAL '3 days'),
  ('33333333-0000-0000-0000-000000000010', 'exit', 3, 'Entrega personal',     NULL,           NOW() - INTERVAL '2 days');

-- ── Movimientos: AJUSTES (fijan stock absoluto — conteo físico) ──
INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_at) VALUES
  ('33333333-0000-0000-0000-000000000006', 'adjustment', 10, 'Conteo físico: diferencia de inventario', NOW() - INTERVAL '1 day'),
  ('33333333-0000-0000-0000-000000000009', 'adjustment', 15, 'Conteo físico: merma detectada',          NOW() - INTERVAL '1 day');
  