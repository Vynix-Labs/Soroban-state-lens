# PR Description

## Summary
- Fix watchlist removal so removing the last pinned item removes the empty contract bucket from state.
- Add regression tests for watchlist removal, persistence, and route behavior.
- Improve decoder normalization for invalid maxDepth values and preserve valid map entries when one entry is malformed.
- Add component tests for the landing screen validation and navigation flow.

## Testing
- Ran targeted Vitest suites covering watchlist, hydration, routing, and decoder behavior.
