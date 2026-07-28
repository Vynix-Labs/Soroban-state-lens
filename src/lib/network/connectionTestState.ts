export function resetConnectionTestState(): {
  status: 'idle'
  error: ''
} {
  return { status: 'idle', error: '' }
}
