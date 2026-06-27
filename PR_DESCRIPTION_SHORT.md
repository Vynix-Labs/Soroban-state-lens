# PR Summary

Implements three focused enhancements:

- Extract `contractspecv0` payload from WASM modules safely.
- Normalize `ScvDuration` and `ScvTimepoint` values as decimal-string primitives.
- Validate persisted display preferences during hydration and fall back to defaults for invalid values.

## Verification

- `npm test -- src/test/lib/wasm.extractor.test.ts src/test/decoder/primitive.duration-timepoint.test.ts src/test/store/preferences-validation.test.ts`
- `npm run build`
