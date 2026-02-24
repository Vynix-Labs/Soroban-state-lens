## Normalize ScAddress to StrKey format

Converts raw address bytes to human-readable StrKey strings for UI display.

**Changes:**

- Added `normalizeScVal()` function to handle ScAddress variants
- Added `@stellar/stellar-sdk` dependency
- Added tests for account and contract address conversion
