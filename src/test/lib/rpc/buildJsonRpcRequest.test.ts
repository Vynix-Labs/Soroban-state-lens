import { describe, expect, it } from 'vitest'
import { buildJsonRpcRequest } from '../../../lib/rpc/buildJsonRpcRequest'

describe('buildJsonRpcRequest', () => {
  it('trims leading and trailing whitespace and returns normalized method', () => {
    const req = buildJsonRpcRequest('  foo.bar  ', [], 1)
    expect(req.method).toBe('foo.bar')
    expect(req.jsonrpc).toBe('2.0')
    expect(req.id).toBe(1)
  })

  it('rejects whitespace-only method names', () => {
    expect(() => buildJsonRpcRequest('   ', {}, 2)).toThrow(
      'JSON-RPC method name cannot be empty',
    )
  })

  it('rejects empty method names', () => {
    expect(() => buildJsonRpcRequest('', null, 3)).toThrow(
      'JSON-RPC method name cannot be empty',
    )
  })
})
