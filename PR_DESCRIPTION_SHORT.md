# PR Summary

Implements three focused UI and formatting fixes:

- Clear the custom RPC autofocus timer on cleanup so delayed focus no longer runs after the panel closes or unmounts.
- Normalize invalid contract ID shortening length options to safe defaults.
- Clamp virtualized tree scroll position after rows shrink to prevent blank viewports.

## Verification

- Added regression coverage for autofocus cleanup, formatter edge cases, and scroll clamping behavior.
- Verified the touched files report no editor-reported errors.
