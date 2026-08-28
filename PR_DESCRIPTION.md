## Summary

This PR tightens contract WASM decoding and improves resilience around malformed simulation payloads.

## What changed
- Added strict base64 validation for contract WASM decoding so malformed payloads now fail safely instead of producing incorrect bytes.
- Preserved support for valid padded and unpadded base64 values that decode canonically.
- Sanitized simulation footprint sections so malformed arrays are treated as empty arrays instead of being passed through as invalid values.
- Added regression tests for invalid base64 input, malformed footprint data, tree-path round-trip escaping, and InspectShell pin behavior.

## Verification
- Ran targeted Vitest suites for contract WASM, simulation adapter, tree path handling, and InspectShell.
- Ran TypeScript type-checking successfully.
