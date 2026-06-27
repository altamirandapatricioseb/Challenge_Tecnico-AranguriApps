import { describe, it, expect } from 'vitest'
import { getStockStatus, canFulfillExit } from '../stock.utils'

describe('getStockStatus', () => {
  it('devuelve critical cuando el stock es 0', () => {
    expect(getStockStatus(0, 5)).toBe('critical')
  })

  it('devuelve critical cuando el stock es negativo', () => {
    expect(getStockStatus(-3, 5)).toBe('critical')
  })

  it('devuelve low cuando el stock es igual al minimo', () => {
    expect(getStockStatus(5, 5)).toBe('low')
  })

  it('devuelve low cuando el stock esta por debajo del minimo pero es positivo', () => {
    expect(getStockStatus(3, 5)).toBe('low')
  })

  it('devuelve ok cuando el stock esta por encima del minimo', () => {
    expect(getStockStatus(10, 5)).toBe('ok')
  })

  it('trata el limite: stock 1 con minimo 0 es ok', () => {
    expect(getStockStatus(1, 0)).toBe('ok')
  })

  it('trata el limite: stock 0 con minimo 0 es critical (prioridad del <= 0)', () => {
    expect(getStockStatus(0, 0)).toBe('critical')
  })
})

describe('canFulfillExit', () => {
  it('permite la salida cuando hay stock suficiente', () => {
    expect(canFulfillExit(10, 5)).toBe(true)
  })

  it('permite la salida cuando el stock es exactamente la cantidad', () => {
    expect(canFulfillExit(5, 5)).toBe(true)
  })

  it('rechaza la salida cuando no hay stock suficiente', () => {
    expect(canFulfillExit(3, 5)).toBe(false)
  })

  it('rechaza una cantidad de 0 (no es una salida valida)', () => {
    expect(canFulfillExit(10, 0)).toBe(false)
  })

  it('rechaza una cantidad negativa', () => {
    expect(canFulfillExit(10, -2)).toBe(false)
  })

  it('rechaza salida si no hay stock', () => {
    expect(canFulfillExit(0, 1)).toBe(false)
  })
})
