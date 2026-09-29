# PR Summary

Adds the discovery transaction simulation workflow:

- Route simulation through the shared typed RPC client without changing the JSON-RPC payload or result mapping.
- Add inline function-name validation, transaction XDR submission, and normalized read/write footprint results.
- Cancel pending simulation requests when leaving the discovery route.
- Cover validation, empty input, simulation success/error, and route-unmount cancellation with regression tests.

## Verification

- `npm test -- src/test/network/simulateTransaction.test.ts src/test/routes/discoveryRoute.test.tsx src/test/routes/discoveryRouteState.test.tsx` (39 passed)
- `npx tsc --noEmit`
