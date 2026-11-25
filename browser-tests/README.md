# Decoder worker browser regression

Run `npm run dev`, then open
`http://localhost:3000/browser-tests/decoder-worker.html` in a browser. The page
reports `PASS` when both the vector and map regressions succeed through the real
Comlink worker, or displays the failure details.

## Discovery argument previews

Run `bun run test:browser -- browser-tests/discovery-arguments.pw.ts`. The Chromium case pastes a transaction containing a maximum u64 and a byte argument, checks the actual worker previews, and edits JSON reference notes without changing those previews or the XDR. It never submits a simulation or transaction.

Previews show at most 16 arguments. Each encoded argument is limited to 64 KiB, decoding depth is four, and each displayed value is limited to 512 characters. Omitted or unsupported values are identified in the view. The CI browser job runs this case after the worker regression.
