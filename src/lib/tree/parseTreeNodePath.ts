/**
 * Decodes a dot-joined escaped path back into its original parts.
 * Escapes are handled using a backslash (\). For example, "a\.b" becomes ["a.b"].
 * If an invalid escape sequence is encountered (e.g., a trailing backslash), an empty array is returned.
 *
 * @param path - The dot-joined escaped path string.
 * @returns An array of decoded path segments, or an empty array if invalid.
 */
export function parseTreeNodePath(path: string): Array<string> {
  if (path === '') {
    return []
  }

  const parts: Array<string> = []
  let currentPart = ''
  let i = 0

  while (i < path.length) {
    const char = path[i]

    if (char === '\\') {
      // Check if there's a character to escape
      if (i + 1 >= path.length) {
        // Invalid escape sequence: trailing backslash
        return []
      }
      // Escaped character - append the next character directly
      currentPart += path[i + 1]
      i += 2
    } else if (char === '.') {
      // Separator - push current part and reset
      parts.push(currentPart)
      currentPart = ''
      i++
    } else {
      // Normal character
      currentPart += char
      i++
    }
  }

  // Push the last part
  parts.push(currentPart)

  return parts
}
