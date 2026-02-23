import { describe, expect, it } from 'vitest'

import { computeRetryDelayMs } from '../../lib/rpc/computeRetryDelayMs'

describe('computeRetryDelayMs', () => {
  // ── Happy path with defaults (baseMs=250, maxMs=5000) ──

  describe('happy path — default parameters', () => {
    it('attempt 0 returns baseMs (250)', () => {
      expect(computeRetryDelayMs(0)).toBe(250)
    })

    it('attempt 1 returns 500', () => {
      expect(computeRetryDelayMs(1)).toBe(500)
    })

    it('attempt 2 returns 1000', () => {
      expect(computeRetryDelayMs(2)).toBe(1000)
    })

    it('attempt 3 returns 2000', () => {
      expect(computeRetryDelayMs(3)).toBe(2000)
    })

    it('attempt 4 returns 4000', () => {
      expect(computeRetryDelayMs(4)).toBe(4000)
    })

    it('attempt 5 is capped at maxMs (5000)', () => {
      expect(computeRetryDelayMs(5)).toBe(5000)
    })

    it.each([6, 7, 8, 9, 10])(
      'attempt %i stays capped at maxMs (5000)',
      (attempt) => {
        expect(computeRetryDelayMs(attempt)).toBe(5000)
      },
    )
  })

  // ── Custom baseMs and maxMs ──

  describe('custom parameters', () => {
    it('respects a custom baseMs', () => {
      expect(computeRetryDelayMs(0, 100)).toBe(100)
      expect(computeRetryDelayMs(1, 100)).toBe(200)
      expect(computeRetryDelayMs(3, 100)).toBe(800)
    })

    it('respects a custom maxMs', () => {
      expect(computeRetryDelayMs(10, 250, 1000)).toBe(1000)
    })

    it('caps at maxMs when baseMs * 2^attempt exceeds it', () => {
      expect(computeRetryDelayMs(3, 500, 2000)).toBe(2000)
    })

    it('returns baseMs when maxMs equals baseMs', () => {
      expect(computeRetryDelayMs(0, 300, 300)).toBe(300)
      expect(computeRetryDelayMs(5, 300, 300)).toBe(300)
    })
  })

  // ── Negative attempt — treated as 0 ──

  describe('negative attempt', () => {
    it('treats -1 as attempt 0', () => {
      expect(computeRetryDelayMs(-1)).toBe(250)
    })

    it('treats -100 as attempt 0', () => {
      expect(computeRetryDelayMs(-100)).toBe(250)
    })

    it('treats -Infinity as attempt 0', () => {
      expect(computeRetryDelayMs(-Infinity)).toBe(250)
    })
  })

  // ── Overflow guard ──

  describe('overflow guard', () => {
    it('caps at maxMs for very large attempt (1024)', () => {
      expect(computeRetryDelayMs(1024)).toBe(5000)
    })

    it('caps at maxMs when 2^attempt overflows to Infinity', () => {
      expect(computeRetryDelayMs(Number.MAX_SAFE_INTEGER)).toBe(5000)
    })

    it('caps at maxMs for Infinity attempt', () => {
      expect(computeRetryDelayMs(Infinity)).toBe(5000)
    })
  })

  // ── Invalid input ──

  describe('invalid input', () => {
    it('treats NaN attempt as 0', () => {
      expect(computeRetryDelayMs(Number.NaN)).toBe(250)
    })
  })

  // ── Integer output ──

  describe('returns integer milliseconds', () => {
    it('floors fractional results from non-integer baseMs', () => {
      const result = computeRetryDelayMs(0, 333.7, 10000)
      expect(Number.isInteger(result)).toBe(true)
      expect(result).toBe(333)
    })

    it('always returns an integer for default params across attempts 0-10', () => {
      for (let i = 0; i <= 10; i++) {
        expect(Number.isInteger(computeRetryDelayMs(i))).toBe(true)
      }
    })
  })

  // ── Monotonic growth until cap ──

  describe('monotonic growth', () => {
    it('each attempt produces a delay >= the previous attempt', () => {
      let prev = 0
      for (let i = 0; i <= 10; i++) {
        const current = computeRetryDelayMs(i)
        expect(current).toBeGreaterThanOrEqual(prev)
        prev = current
      }
    })

    it('delay doubles each attempt before hitting the cap', () => {
      expect(computeRetryDelayMs(1)).toBe(computeRetryDelayMs(0) * 2)
      expect(computeRetryDelayMs(2)).toBe(computeRetryDelayMs(1) * 2)
      expect(computeRetryDelayMs(3)).toBe(computeRetryDelayMs(2) * 2)
    })
  })
})
