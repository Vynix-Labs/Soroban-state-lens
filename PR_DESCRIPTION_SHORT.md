# PR Summary

Implements focused RPC and store-slice hardening for request IDs, contract-spec caching, and ledger-entry validation.

## What changed

- Wrap generated RPC request IDs safely before they reach the JS safe-integer limit.
- Validate JSON-RPC request IDs before building payloads, rejecting invalid values early.
- Normalize contract IDs in the contract-spec cache so equivalent inputs resolve to the same entry.
- Validate ledger-entry result shape before mapping to prevent malformed RPC responses from crashing downstream flows.

## Verification

- `node node_modules/vitest/vitest.mjs run src/test/rpc/toRpcRequestId.test.ts src/test/rpc/buildJsonRpcRequest.test.ts src/test/store/contractSpecSlice.test.ts src/test/network/getLedgerEntries.test.ts --reporter=default`
