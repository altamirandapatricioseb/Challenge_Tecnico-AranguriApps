-- ============================================================
-- MIGRACION 004 — Vistas de consulta
-- ============================================================
-- Vistas para consultas frecuentes: productos con detalle, stock bajo,
-- movimientos con producto, resumen diario y distribucion por categoria.
-- products_with_details oculta categorias/proveedores soft-deleted (is_active).
-- ============================================================

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
