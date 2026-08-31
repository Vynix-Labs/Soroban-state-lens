# Fix: Store & Selector Robustness Improvements

## Summary

Implements four focused improvements to store actions and selectors to enhance reliability and accessibility:
- Reject empty contract IDs in snapshot operations to prevent unreachable state
- Prevent mutation of shared ledger arrays in selectors  
- Bound selector cache to prevent unbounded memory growth
- Return keyboard focus to retry control after load errors

## Changes

### #509: Reject empty contract IDs in snapshot actions
- Validate and trim contract IDs in `addSnapshot()`, `removeSnapshot()`, and `clearSnapshots()`
- Ignore operations with empty or whitespace-only contract IDs
- Add regression tests for empty and whitespace contract ID handling

### #517: Avoid mutating ledger arrays inside selectors
- Create array copy before sorting in `selectLedgerEntriesByContractId()`
- Ensures callers and tests can safely mutate returned arrays
- Add tests verifying original ledgerData remains immutable

### #516: Bound selector cache contract keys
- Implement bounded cache with max 50 entries and FIFO eviction policy
- Automatically clear stale entries when ledgerData reference changes
- Prevents unbounded memory growth across browsing sessions

### #519: Return focus to retry control after load errors
- Add `useRef` to error retry button in explorer route
- Move focus to retry button when `contractLoadStatus` transitions to ERROR
- Improves keyboard navigation accessibility for error recovery

## Verification

```bash
npm test                 # All 1,633 tests passing
npm run lint            # Code quality checks
npm run format          # Prettier formatting applied
git diff --stat         # 7 files changed, 252 insertions
```

## Checklist

- [x] Tests added or updated when needed (38 new tests added)
- [x] Relevant checks pass locally (1,633 tests passing)
- [x] Documentation updated when needed
- [x] Code formatted with Prettier
- [x] All acceptance criteria met
