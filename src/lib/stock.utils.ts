import type { StockStatus } from '@/types'
/*
  - 'critical': sin stock (<= 0)
  - 'low':      con stock pero en o por debajo del mínimo
  - 'ok':       por encima del mínimo
*/
export function getStockStatus(currentStock: number, minStock: number): StockStatus {
  if (currentStock <= 0) return 'critical'
  if (currentStock <= minStock) return 'low'
  return 'ok'
}

/*
 - indica si hay stock suficiente para cubrir una salida.
 - valida el trigger handle_stock_movement(),
*/
export function canFulfillExit(currentStock: number, quantity: number): boolean {
  return quantity > 0 && currentStock >= quantity
}
