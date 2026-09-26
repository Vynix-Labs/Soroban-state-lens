# Pull Request: Add Contract Watchlist Route

## Summary
- Added a new route for contract-specific watchlists at `/contracts/:contractId/watchlist`.
- Implemented an empty state for contracts with no saved watchlist items.
- Added saved watchlist item cards with `Inspect` and `Remove` actions.
- Preserved route parameter validation and normalized contract IDs using the existing route-level validator.

## Files Changed
- `src/routes/contracts/$contractId/watchlist.tsx`
- `src/test/routes/watchlistRoute.test.tsx`
- `src/store/lensStore.ts`
- `src/routeTree.gen.ts`

## Notes
- Fixed a React selector stability issue by returning a constant empty array from `useWatchlist` and `useSnapshots` when no data exists.
- The watchlist state remains non-persistent as intended.

## Validation
- Full test suite passed: `101` files, `1180` tests
- Branch pushed to `origin/feature/watchlist-route`
