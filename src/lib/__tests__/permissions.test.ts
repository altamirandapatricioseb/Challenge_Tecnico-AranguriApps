import { describe, it, expect } from 'vitest'
import { canWrite } from '../permissions'

describe('canWrite', () => {
  it('permite escribir al admin', () => {
    expect(canWrite('admin')).toBe(true)
  })

  it('permite escribir al manager', () => {
    expect(canWrite('manager')).toBe(true)
  })

  it('no permite escribir al viewer', () => {
    expect(canWrite('viewer')).toBe(false)
  })
})
