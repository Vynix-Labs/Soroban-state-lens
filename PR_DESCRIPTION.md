# PR: Thread maxDepth through worker decodeScVal and add selectSnapshotsForContract selector

## Summary
- Extend the decoder worker `decodeScVal` request type to accept an optional `maxDepth` field.
- Forward `maxDepth` into `normalizeNode` during XDR-decoded ScVal normalization.
- Add a regression test ensuring `decodeScVal` returns truncated nodes when `maxDepth` is set.
- Add `selectSnapshotsForContract` selector to the store selectors and tests for known and unknown contracts.

## Validation
- `npm exec -- vitest run src/test/workers/decodeScVal.internal.test.ts`
- `npm exec -- vitest run src/test/store/selectors.test.ts`
