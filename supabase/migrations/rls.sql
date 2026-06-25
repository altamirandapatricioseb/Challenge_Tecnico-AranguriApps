-- ============================================================
-- Row Level Security
-- ============================================================

--obtener rol del usuario actual
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
