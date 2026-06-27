-- ============================================================
-- MIGRACION 006 — Datos de ejemplo (seed)
-- ============================================================
-- Carga categorias, proveedores, productos y movimientos de ejemplo.
-- El stock de cada producto se construye a partir de los movimientos.
-- ============================================================

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