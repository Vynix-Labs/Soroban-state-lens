# PR: Add Discovery Transaction Simulation Workflow

## Summary

- Route `simulateTransaction` requests through the shared typed RPC client while preserving the existing JSON-RPC payload and normalized result/error behavior.
- Add a discovery form for transaction XDR with inline Soroban function-name validation and deterministic empty-input handling.
- Display normalized read-only and read-write footprint keys and allow discovered keys to be added to the contract watchlist.
- Abort pending simulation requests when the discovery route unmounts, preventing late state updates.
- Add focused regression coverage for request payload compatibility, validation, empty input, successful discovery, RPC errors, and route-exit cancellation.

## Validation

- `npm test -- src/test/network/simulateTransaction.test.ts src/test/routes/discoveryRoute.test.tsx src/test/routes/discoveryRouteState.test.tsx` (39 tests passed)
- `npx tsc --noEmit`
- `npx eslint src/lib/network/simulateTransaction.ts 'src/routes/contracts/$contractId/discovery.tsx' src/test/network/simulateTransaction.test.ts src/test/routes/discoveryRoute.test.tsx` (no errors; existing test-mock warnings)
