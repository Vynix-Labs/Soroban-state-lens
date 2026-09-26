# PR: Implement issues #382, #364, #320, #321

Short summary

- Replace JSON-based cloning with a robust `deepClone` to preserve `undefined` and typed arrays (fixes #382).
- Deduplicate ledger keys before `getLedgerEntries` RPC requests to reduce payloads (fixes #364).
- Add and stabilize component tests for `ContractLookUpInput` (fixes #321).
- Add and stabilize component tests for `NetworkSelector` (fixes #320).

What changed

- Added `src/lib/deepClone.ts` and replaced JSON cloning in snapshot creation.
- Added `src/lib/network/deduplicateKeys.ts` and integrated it into `getLedgerEntries`.
- Added tests under `src/test/components/` and unit tests for deduplication and snapshot behavior.

Testing

Run the test suite locally:

```bash
npm ci
npx vitest
```

Notes

- All tests pass locally when this branch was prepared.
- See branch `issues/382-364-320-321` for the full commit history.
