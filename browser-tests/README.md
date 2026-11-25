# Decoder worker browser regression

Run `npm run dev`, then open
`http://localhost:3000/browser-tests/decoder-worker.html` in a browser. The page
reports `PASS` when both the vector and map regressions succeed through the real
Comlink worker, or displays the failure details.

## Inspector WASM upload

Run `bun run test:browser -- browser-tests/inspector-upload.pw.ts`. Playwright starts the app and uses real Chromium file selection to upload a non-executable two-field WASM fixture. The test checks that an explicit struct choice changes `[0]` to `first_value` while retaining value `7`, its raw path, and the entry XDR. It also checks value `9`, unchanged persisted network state, and the unrelated demo counter.

Install the browser first with `bunx playwright install chromium` if needed. The CI browser job runs this acceptance case after the worker regression.
