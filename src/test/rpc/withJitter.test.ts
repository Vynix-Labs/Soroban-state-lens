import { describe, expect, it, vi } from 'vitest';
import { withJitter } from '../../lib/rpc/withJitter';

describe('withJitter', () => {
    it('should return jittered value within range [ms*(1-ratio), ms*(1+ratio)]', () => {
        const ms = 1000;
        const ratio = 0.2; // +/- 200ms range [800, 1200]

        // random = 0 -> min: 800
        expect(withJitter(ms, ratio, () => 0)).toBe(800);

        // random = 0.5 -> mid: 1000
        expect(withJitter(ms, ratio, () => 0.5)).toBe(1000);

        // random = 1 -> max: 1200
        expect(withJitter(ms, ratio, () => 1)).toBe(1200);
    });

    it('should use default ratio of 0.2', () => {
        const ms = 1000;
        // random = 0 -> min: 800
        expect(withJitter(ms, undefined, () => 0)).toBe(800);
        // random = 1 -> max: 1200
        expect(withJitter(ms, undefined, () => 1)).toBe(1200);
    });

    it('should clamp ratio to [0, 1]', () => {
        const ms = 1000;

        // Negative ratio clamped to 0
        expect(withJitter(ms, -0.5, () => 0.5)).toBe(1000);
        expect(withJitter(ms, -0.5, () => 1)).toBe(1000);

        // Ratio > 1 clamped to 1
        expect(withJitter(ms, 1.5, () => 0)).toBe(0);
        expect(withJitter(ms, 1.5, () => 1)).toBe(2000);
    });

    it('should handle ms <= 0 by returning 0', () => {
        expect(withJitter(0)).toBe(0);
        expect(withJitter(-100)).toBe(0);
    });

    it('should round result to nearest integer', () => {
        // ms=10.5, ratio=0.2 -> range [8.4, 12.6]
        // random=0.1 -> 8.4 + 0.1 * (12.6 - 8.4) = 8.4 + 0.42 = 8.82 -> 9
        expect(withJitter(10.5, 0.2, () => 0.1)).toBe(9);

        // random=0.9 -> 8.4 + 0.9 * (4.2) = 8.4 + 3.78 = 12.18 -> 12
        expect(withJitter(10.5, 0.2, () => 0.9)).toBe(12);
    });

    it('should use Math.random by default', () => {
        const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const ms = 1000;
        expect(withJitter(ms)).toBe(1000);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
