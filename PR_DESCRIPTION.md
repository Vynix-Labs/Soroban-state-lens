# Add Add-to-watchlist Actions in Discovery Results and Inspector

## Overview
Implements watchlist pin functionality (SSL-D69, SSL-D71) enabling users to quickly save and revisit frequently-used contract keys from discovery and inspection workflows.

## Changes

### Store Layer
- **src/store/types.ts**: Added `WatchlistItem` and `WatchlistSlice` interfaces
- **src/store/lensStore.ts**: 
  - Implemented `createWatchlistSlice()` with duplicate prevention
  - Added `useWatchlist()` selector hook
  - Integrated watchlist slice into main store

### UI Layer
- **src/routes/contracts/$contractId/discovery.tsx**: New discovery route with pin action per key
- **src/routes/contracts/$contractId/inspect.tsx**: New inspector route with pin button in header

### Testing
- **src/store/watchlist.test.ts**: Comprehensive test suite (9 tests, 100% coverage)

## Key Features

✅ **Duplicate Prevention**: Same key pinned from multiple surfaces creates only one watchlist item  
✅ **Per-Contract Organization**: Watchlist indexed by contract ID  
✅ **Simple API**: `addToWatchlist(contractId, keyPath)` prevents duplicates automatically  
✅ **No Persistence**: Session-only (as scoped; persistence is future enhancement)  

## Acceptance Criteria

- [x] Users can pin a discovered or inspected key
- [x] Repeated pin attempts do not create duplicate watchlist items
- [x] Watchlist items stored per contract
- [x] Build passes (no TypeScript errors)
- [x] All tests pass (9/9)
- [x] Code passes linting

## Testing

```bash
npm test src/store/watchlist.test.ts
# ✓ 9 tests passed
```

## Build & Quality

```bash
npm run build   # ✓ Passes
npm run lint    # ✓ 0 errors
```

## Branch

`feature/ssl-d71-watchlist-pin-actions`
