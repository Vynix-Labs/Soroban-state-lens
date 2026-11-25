import type { Node } from '../../types/node'

export const MAX_ARGUMENT_PREVIEW_CHARACTERS = 512

/** Format normalized decoder values without numeric coercion or unbounded traversal. */
export function formatArgumentPreview(node: Node): string {
  const visit = (value: Node, depth: number): string => {
    if (depth > 4) return '…'
    switch (value.kind) {
      case 'primitive':
        if (value.scType === 'bytes' && Array.isArray(value.value)) {
          const hex = value.value
            .slice(0, 32)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')
          const suffix =
            value.value.length > 32 ? `… (${value.value.length} bytes)` : ''
          return `0x${hex}${suffix}`
        }
        if (value.scType === 'string' || value.scType === 'symbol') {
          const text = String(value.value)
          return `${JSON.stringify(text.slice(0, 160))}${text.length > 160 ? '…' : ''}`
        }
        return String(value.value)
      case 'address':
        return value.value
      case 'vec':
        return `[${value.items
          .slice(0, 8)
          .map((item) => visit(item, depth + 1))
          .join(', ')}${value.items.length > 8 ? ', …' : ''}]`
      case 'map':
        return `{${value.entries
          .slice(0, 8)
          .map(
            (item) =>
              `${visit(item.key, depth + 1)}: ${visit(item.value, depth + 1)}`,
          )
          .join(', ')}${value.entries.length > 8 ? ', …' : ''}}`
      case 'error':
        return `${value.errorType}:${value.code}`
      case 'unsupported':
        return `Unsupported ${value.variant}`
      case 'truncated':
        return '… (depth limit)'
      case 'cycle':
        return '… (cycle)'
    }
  }
  const text = visit(node, 0)
  return text.length > MAX_ARGUMENT_PREVIEW_CHARACTERS
    ? `${text.slice(0, MAX_ARGUMENT_PREVIEW_CHARACTERS - 1)}…`
    : text
}
