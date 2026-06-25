-- ============================================================
-- — Schema inicial
-- ============================================================

-- Helper: actualizar updated_at automáticamente
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
