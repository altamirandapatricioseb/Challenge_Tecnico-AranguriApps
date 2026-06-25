'use client'

import { Package, ArrowLeftRight, AlertTriangle, DollarSign, Boxes } from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { DataTable, type Column } from '@/components/app/DataTable'
import { StockBadge } from '@/components/app/StockBadge'
import { formatCurrency } from '@/lib/format.utils'

//: datos simulados solo para previsualizar el sistema  Actions reales (getDashboardKPIs, getProducts, getRecentMovements, etc.).
type MockProduct = {
  id: string; name: string; sku: string; category: string; categoryColor: string
  current_stock: number; min_stock: number; unit_price: number; supplier: string
}

const MOCK_PRODUCTS: MockProduct[] = [
  { id: '1', name: 'Soldador 40W Stayer',         sku: 'ELC-003', category: 'Electrónica',  categoryColor: '#6366f1', current_stock: 0,  min_stock: 3,  unit_price: 4200,  supplier: 'TechDistrib SA' },
  { id: '2', name: 'Casco Seguridad 3M',          sku: 'IND-002', category: 'Indumentaria', categoryColor: '#ec4899', current_stock: 2,  min_stock: 5,  unit_price: 5600,  supplier: 'HerraMax SRL' },
  { id: '3', name: 'Cable UTP Cat6 (rollo 100m)', sku: 'ELC-002', category: 'Electrónica',  categoryColor: '#6366f1', current_stock: 3,  min_stock: 5,  unit_price: 12400, supplier: 'TechDistrib SA' },
  { id: '4', name: 'Amoladora Angular 115mm',     sku: 'HRR-002', category: 'Herramientas', categoryColor: '#f59e0b', current_stock: 4,  min_stock: 4,  unit_price: 18500, supplier: 'HerraMax SRL' },
  { id: '5', name: 'Multímetro Digital UNI-T',    sku: 'ELC-001', category: 'Electrónica',  categoryColor: '#6366f1', current_stock: 12, min_stock: 5,  unit_price: 8500,  supplier: 'TechDistrib SA' },
  { id: '6', name: 'Taladro Percutor 1/2" Bosch', sku: 'HRR-001', category: 'Herramientas', categoryColor: '#f59e0b', current_stock: 7,  min_stock: 3,  unit_price: 42000, supplier: 'HerraMax SRL' },
  { id: '7', name: 'Papel A4 (resma 500 hojas)',  sku: 'INS-001', category: 'Insumos',      categoryColor: '#10b981', current_stock: 25, min_stock: 10, unit_price: 3200,  supplier: 'Insumos Norte' },
]

const columns: Column<MockProduct>[] = [
  { key: 'sku',  header: 'SKU',      cell: (p) => <span className="font-data text-slate-500">{p.sku}</span> },
  { key: 'name', header: 'Producto', cell: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
  {
    key: 'category', header: 'Categoría',
    cell: (p) => (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.categoryColor }} />
        {p.category}
      </span>
    ),
  },
  { key: 'stock',    header: 'Stock',     align: 'right', cell: (p) => <span className="font-data">{p.current_stock}</span> },
  { key: 'status',   header: 'Estado',                    cell: (p) => <StockBadge currentStock={p.current_stock} minStock={p.min_stock} /> },
  { key: 'price',    header: 'Precio',    align: 'right', cell: (p) => <span className="font-data">{formatCurrency(p.unit_price)}</span> },
  { key: 'supplier', header: 'Proveedor',                 cell: (p) => <span className="text-slate-600">{p.supplier}</span> },
]

const stockValue = MOCK_PRODUCTS.reduce((acc, p) => acc + p.current_stock * p.unit_price, 0)

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Resumen general</h2>
        <p className="text-sm text-slate-500">Previsualización con datos de ejemplo (Bloque 2).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Productos activos"  value={MOCK_PRODUCTS.length}     icon={Package}        delta={4.2} />
        <KpiCard title="Stock crítico/bajo" value={4}                        icon={AlertTriangle}  hint="En o bajo el mínimo" />
        <KpiCard title="Movimientos hoy"    value={3}                        icon={ArrowLeftRight} delta={-1.5} />
        <KpiCard title="Valor de stock"     value={formatCurrency(stockValue)} icon={DollarSign}   delta={2.8} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Productos</h3>
        <DataTable
          columns={columns}
          data={MOCK_PRODUCTS}
          rowKey={(p) => p.id}
          pageSize={5}
          emptyIcon={Boxes}
          emptyTitle="Sin productos"
          emptyDescription="Todavía no cargaste productos al inventario."
        />
      </div>
    </div>
  )
}
