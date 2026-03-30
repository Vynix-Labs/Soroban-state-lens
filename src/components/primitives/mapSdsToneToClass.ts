/**
 * Maps SDS tone to a class token.
 *
 * Rules:
 * - Deterministic mapping
 * - Fallback to neutral for unknown values
 */
export function mapSdsToneToClass(
  tone: 'neutral' | 'success' | 'warning' | 'error',
): string {
  const TONE_CLASS_MAP: Record<string, string> = {
    neutral: 'sds-tone-neutral',
    success: 'sds-tone-success',
    warning: 'sds-tone-warning',
    error: 'sds-tone-error',
  }

  return TONE_CLASS_MAP[tone] ?? TONE_CLASS_MAP['neutral']
}
