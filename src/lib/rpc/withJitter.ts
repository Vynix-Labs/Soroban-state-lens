/**
 * Applies a random jitter to a given millisecond value.
 *
 * @param ms - The base millisecond value to jitter.
 * @param ratio - The maximum percentage of jitter to apply (0 to 1). Defaults to 0.2 (±20%).
 * @param random - A function that returns a random number between 0 and 1. Defaults to Math.random.
 * @returns The jittered millisecond value, rounded to the nearest integer.
 *          Returns 0 for ms <= 0.
 */
export function withJitter(
    ms: number,
    ratio = 0.2,
    random = Math.random,
): number {
    if (ms <= 0) {
        return 0;
    }

    // Clamp ratio to [0, 1]
    const clampedRatio = Math.max(0, Math.min(1, ratio));

    const min = ms * (1 - clampedRatio);
    const max = ms * (1 + clampedRatio);

    const result = min + random() * (max - min);

    return Math.round(result);
}
