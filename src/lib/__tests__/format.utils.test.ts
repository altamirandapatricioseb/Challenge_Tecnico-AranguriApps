import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatDateTime, formatSKU } from '../format.utils'

describe('formatCurrency', () => {
  it('formatea un numero como moneda con simbolo de peso', () => {
    const result = formatCurrency(1234.5)
    // No comparar el string exacto porque el separador depende del locale del entorno
    expect(result).toContain('$')
    expect(result).toMatch(/1.?234/)
  })

  it('formatea el cero correctamente', () => {
    const result = formatCurrency(0)
    expect(result).toContain('$')
    expect(result).toContain('0')
  })

  it('usa 0 cuando recibe un valor nullish (guarda del ?? 0)', () => {
    // @ts-expect-error probar el guard interno ante un valor invalido
    const result = formatCurrency(null)
    expect(result).toContain('$')
    expect(result).toContain('0')
  })
})

describe('formatDate', () => {
  it('formatea una fecha ISO sin romper', () => {
    const result = formatDate('2026-06-15T10:30:00Z')
    // El formato es-AR usa mes abreviado
    expect(result).toContain('2026')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('acepta un objeto Date directamente', () => {
    const result = formatDate(new Date('2026-01-20'))
    expect(result).toContain('2026')
  })
})

describe('formatDateTime', () => {
  it('formatea fecha y hora incluyendo el ano', () => {
    const result = formatDateTime('2026-06-15T10:30:00Z')
    expect(result).toContain('2026')
    expect(typeof result).toBe('string')
  })
})

describe('formatSKU', () => {
  it('convierte a mayusculas', () => {
    expect(formatSKU('abc-001')).toBe('ABC-001')
  })

  it('recorta espacios al inicio y final', () => {
    expect(formatSKU('  abc-001  ')).toBe('ABC-001')
  })

  it('combina trim y mayusculas', () => {
    expect(formatSKU('  prod-test  ')).toBe('PROD-TEST')
  })
})
