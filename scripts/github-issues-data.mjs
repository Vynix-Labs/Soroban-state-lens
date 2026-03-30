export const issues = [
  {
    id: 'SSL-D01',
    title: 'Restore Vitest browser test startup',
    phase: 0,
    area: 'qa',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: [],
    problem:
      'The repo exits before test collection because the browser test environment crashes on a jsdom and ESM mismatch.',
    context:
      'Build and lint pass, and several test files already exist, but npm test fails before any test runs.',
    scopeIn: [
      'Make the configured browser test environment boot successfully.',
      'Keep the existing test command working.',
    ],
    scopeOut: ['No new product features.', 'No broad test rewrite.'],
    checklist: [
      'Identify the failing dependency path.',
      'Adjust config or dependency versions to remove the startup crash.',
      'Confirm existing suites execute again.',
    ],
    acceptance: [
      'Vitest collects current test files instead of failing during environment startup.',
      'The current html-encoding-sniffer ESM error is gone.',
    ],
    verification: [
      'Run npm test.',
      'Confirm tests are collected and executed.',
      'Confirm the previous startup error no longer appears.',
    ],
  },
  {
    id: 'SSL-D02',
    title: 'Add storage key and serializer for saved network config',
    phase: 1,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem: 'Network choice resets on reload.',
    context: 'The selector updates in-memory state only.',
    scopeIn: [
      'Add one storage key.',
      'Serialize preset and custom RPC values safely.',
    ],
    scopeOut: ['No UI changes.', 'No ledger-data persistence.'],
    checklist: [
      'Define the stored shape.',
      'Add serialize and parse helpers.',
      'Fall back safely on malformed payloads.',
    ],
    acceptance: [
      'Saved preset and custom values can round-trip.',
      'Malformed payloads fall back safely.',
    ],
    verification: [
      'Save a preset and reload.',
      'Save a custom RPC and reload.',
      'Inject bad JSON and confirm fallback.',
    ],
  },
  {
    id: 'SSL-D03',
    title: 'Hydrate saved network config on app start',
    phase: 1,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D02'],
    problem:
      'Persistence is incomplete if the app never restores the saved selection.',
    context: 'Startup always falls back to the default network.',
    scopeIn: [
      'Read saved network config during startup.',
      'Initialize state from valid saved data.',
    ],
    scopeOut: ['No new selector UI.', 'No connection testing.'],
    checklist: [
      'Read the persisted payload once during initialization.',
      'Validate it with the serializer from the previous issue.',
      'Fall back to the default network on invalid data.',
    ],
    acceptance: [
      'Reloading restores the last valid network selection.',
      'Invalid stored payloads fall back to the default network without throwing.',
    ],
    verification: [
      'Save a preset network and reload.',
      'Save a custom RPC and reload.',
      'Place invalid JSON in storage and confirm safe fallback.',
    ],
  },
  {
    id: 'SSL-D04',
    title: 'Replace the landing placeholder with a contract-entry empty state',
    phase: 1,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem: 'The landing route still shows placeholder copy.',
    context:
      'The shell, lookup input, and network selector exist, but the route body does not guide the first action.',
    scopeIn: [
      'Add a simple product summary.',
      'Point users toward entering a contract ID.',
    ],
    scopeOut: ['No fetch pipeline.', 'No marketing page redesign.'],
    checklist: [
      'Replace placeholder text.',
      'Add a short product explanation.',
      'Keep the state responsive inside the existing shell.',
    ],
    acceptance: [
      'Visiting / shows useful product context.',
      'The page no longer renders placeholder text.',
    ],
    verification: [
      'Run the app and visit /.',
      'Confirm desktop and mobile layouts stay intact.',
    ],
  },
  {
    id: 'SSL-D05',
    title: 'Show a custom RPC input when Custom network is selected',
    phase: 1,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem: 'The selector advertises Custom mode but has no endpoint field.',
    context: 'Choosing Custom does not reveal any editable RPC input today.',
    scopeIn: [
      'Render one text input for a custom RPC URL.',
      'Show it only when Custom is active.',
    ],
    scopeOut: ['No validation logic.', 'No connection testing.'],
    checklist: [
      'Detect Custom selection.',
      'Render the endpoint input in the selector flow.',
      'Preserve typed input while the selector stays open.',
    ],
    acceptance: [
      'Choosing Custom reveals an editable RPC field.',
      'Switching back to a preset hides the field without breaking preset selection.',
    ],
    verification: [
      'Open the selector and choose Custom.',
      'Type a URL.',
      'Switch away and back and confirm predictable behavior.',
    ],
  },
  {
    id: 'SSL-D06',
    title: 'Add a custom RPC URL validator',
    phase: 1,
    area: 'network',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D05'],
    problem:
      'Malformed custom endpoints will produce confusing failures later.',
    context: 'The app needs a focused rule for what counts as a valid RPC URL.',
    scopeIn: [
      'Validate trimmed HTTP and HTTPS URLs.',
      'Return a clear valid or invalid result.',
    ],
    scopeOut: [
      'No network call.',
      'No UI rendering beyond the validator result.',
    ],
    checklist: [
      'Trim whitespace.',
      'Reject empty strings and unsupported protocols.',
      'Accept standard http and https URLs.',
    ],
    acceptance: [
      'Common valid RPC URLs pass.',
      'Malformed URLs fail with test coverage for both cases.',
    ],
    verification: [
      'Add tests for blank strings.',
      'Add tests for ftp URLs.',
      'Add tests for valid Soroban RPC URLs.',
    ],
  },
  {
    id: 'SSL-D07',
    title: 'Disable custom RPC save when the URL is invalid',
    phase: 1,
    area: 'ui',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D06'],
    problem:
      'Users should not be able to commit an invalid endpoint into app state.',
    context:
      'The selector is gaining a custom field and validator but still needs an interaction guard.',
    scopeIn: [
      'Block the apply action for invalid Custom input.',
      'Render a disabled state.',
    ],
    scopeOut: ['No network call.', 'No retry logic.'],
    checklist: [
      'Wire the validator into the selector UI.',
      'Disable the action for invalid input.',
      'Leave preset options unaffected.',
    ],
    acceptance: [
      'Invalid Custom input cannot be applied.',
      'Valid Custom input and preset choices still work.',
    ],
    verification: [
      'Enter an invalid URL and confirm the action is disabled.',
      'Enter a valid URL and confirm the action becomes available.',
    ],
  },
  {
    id: 'SSL-D08',
    title: 'Add a getLatestLedger connection-check helper',
    phase: 1,
    area: 'network',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem:
      'A lightweight connectivity check is needed before trusting a custom endpoint.',
    context: 'The app has no minimal RPC probe yet.',
    scopeIn: [
      'Call the Soroban RPC getLatestLedger method.',
      'Return a small success or error result.',
    ],
    scopeOut: ['No polling loop.', 'No contract data fetches.'],
    checklist: [
      'Build the JSON-RPC request payload.',
      'Parse the success response minimally.',
      'Normalize obvious network and request failures.',
    ],
    acceptance: [
      'A reachable endpoint returns a ledger result.',
      'Unreachable or malformed endpoints return a handled failure result.',
    ],
    verification: [
      'Run the helper against a known good endpoint.',
      'Run it against a bad endpoint or mocked failure.',
    ],
  },
  {
    id: 'SSL-D09',
    title: 'Add network connection status state',
    phase: 1,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D08'],
    problem: 'The UI needs explicit lifecycle state for endpoint diagnostics.',
    context:
      'There is no dedicated connection-status field in global state today.',
    scopeIn: [
      'Add idle, loading, success, and error state.',
      'Expose update and reset actions.',
    ],
    scopeOut: [
      'No selector layout changes.',
      'No persistence of diagnostic history.',
    ],
    checklist: [
      'Add the status enum to state.',
      'Add actions to set and reset it.',
      'Keep the default state idle.',
    ],
    acceptance: [
      'The store can represent a full connection-check lifecycle.',
      'Status updates do not mutate unrelated network fields.',
    ],
    verification: [
      'Exercise the new actions in store tests.',
      'Confirm status transitions do not affect selected endpoint values.',
    ],
  },
  {
    id: 'SSL-D10',
    title: 'Add a Test connection action for custom RPC',
    phase: 1,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D08', 'SSL-D09'],
    problem:
      'Users need a deliberate way to verify a custom RPC before relying on it.',
    context:
      'Validation and connectivity helpers are landing separately, but the selector still lacks a trigger.',
    scopeIn: [
      'Add one test-connection trigger.',
      'Update and render the existing status state.',
    ],
    scopeOut: ['No automatic polling.', 'No save-on-success behavior.'],
    checklist: [
      'Add the trigger to the selector flow.',
      'Set status to loading during the request.',
      'Render success and error feedback from the result.',
    ],
    acceptance: [
      'Clicking Test connection produces visible loading and success or error states.',
      'Testing an endpoint does not silently save it.',
    ],
    verification: [
      'Test a good endpoint in the UI.',
      'Test a bad endpoint in the UI.',
      'Confirm the status transitions are accurate.',
    ],
  },
  {
    id: 'SSL-D11',
    title: 'Add a contract ID validator helper',
    phase: 1,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem:
      'Contract lookup should reject malformed values before routing or network work begins.',
    context: 'The lookup input currently accepts arbitrary text.',
    scopeIn: [
      'Validate Soroban contract IDs.',
      'Return a clear pass or fail result.',
    ],
    scopeOut: ['No navigation.', 'No contract fetch.'],
    checklist: [
      'Trim input.',
      'Reject blank and malformed values.',
      'Accept valid contract IDs using Soroban rules.',
    ],
    acceptance: [
      'Valid contract IDs pass.',
      'Malformed or blank inputs fail with focused tests.',
    ],
    verification: [
      'Add tests for valid contract IDs.',
      'Add tests for blank input.',
      'Add tests for random strings and malformed values.',
    ],
  },
  {
    id: 'SSL-D12',
    title: 'Add a submit button to the contract lookup input',
    phase: 1,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem: 'The lookup still needs a visible primary action.',
    context:
      'The header input exists and supports the keyboard focus shortcut, but it has no dedicated submit control.',
    scopeIn: ['Add one submit button.', 'Use the same submit path as Enter.'],
    scopeOut: ['No validation messaging.', 'No routing behavior.'],
    checklist: [
      'Wrap the lookup in a form or submit handler.',
      'Add a clear button label or icon.',
      'Keep the focus shortcut working.',
    ],
    acceptance: [
      'The lookup shows a visible submit action.',
      'Clicking the button and pressing Enter trigger the same submit path.',
    ],
    verification: [
      'Type text in the lookup.',
      'Click the button.',
      'Press Enter and confirm the same submit flow fires.',
    ],
  },
  {
    id: 'SSL-D13',
    title: 'Show an inline contract ID validation message',
    phase: 1,
    area: 'ui',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D11', 'SSL-D12'],
    problem: 'Invalid contract input should fail near the field.',
    context: 'Lookup has no field-level feedback today.',
    scopeIn: [
      'Show one inline validation message near the input.',
      'Clear the message when input becomes valid.',
    ],
    scopeOut: ['No async fetch errors.', 'No route-level error boundary work.'],
    checklist: [
      'Run the contract validator on submit or blur.',
      'Surface a short message.',
      'Clear the message after correction.',
    ],
    acceptance: [
      'Invalid contract input shows a clear message.',
      'Valid input clears the message and does not show an error.',
    ],
    verification: [
      'Submit a blank or malformed contract ID.',
      'Confirm the message appears.',
      'Enter a valid contract ID and confirm it clears.',
    ],
  },
  {
    id: 'SSL-D14',
    title: 'Scaffold the explorer route for a contract',
    phase: 1,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem:
      'Contract submit cannot land anywhere meaningful until the explorer route exists.',
    context: 'The repo only has the root route and an SDS demo route today.',
    scopeIn: [
      'Add /contracts/:contractId/explorer.',
      'Render minimal contract-context placeholder content.',
    ],
    scopeOut: ['No real fetch pipeline.', 'No tree rendering.'],
    checklist: [
      'Create the route.',
      'Read the contract ID param.',
      'Render a minimal contract-aware shell.',
    ],
    acceptance: [
      'Visiting the explorer route renders a stable page.',
      'The route shows active contract context.',
    ],
    verification: [
      'Open the route directly in the browser.',
      'Refresh it and confirm it still resolves.',
    ],
  },
  {
    id: 'SSL-D15',
    title: 'Navigate to explorer after a valid contract submit',
    phase: 1,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D11', 'SSL-D14'],
    problem:
      'Lookup is incomplete unless valid input moves the user into contract context.',
    context:
      'The app has a lookup shell and will have validation and an explorer route, but submit still needs routing behavior.',
    scopeIn: [
      'On valid submit, route to the explorer page.',
      'Keep invalid submit on the current page.',
    ],
    scopeOut: ['No fetch pipeline.', 'No recent contract history.'],
    checklist: [
      'Wire the submit handler to the router.',
      'Pass the validated contract ID into the route param.',
      'Preserve invalid-input behavior.',
    ],
    acceptance: [
      'Valid contract submit navigates to the explorer route.',
      'Invalid submit never changes the route.',
    ],
    verification: [
      'Submit a valid contract ID and confirm navigation.',
      'Submit an invalid value and confirm the route does not change.',
    ],
  },
  {
    id: 'SSL-D16',
    title: 'Define a normalized node union with path and raw metadata',
    phase: 2,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: [],
    problem:
      'The decoder needs a stable typed output before more complex ScVal support can be added safely.',
    context:
      'Primitive normalization currently returns JSON-like values that are too lossy for tree rendering and diffs.',
    scopeIn: [
      'Define primitive and container node shapes.',
      'Keep stable path and raw fallback metadata.',
    ],
    scopeOut: ['No UI rendering.', 'No schema overlay.'],
    checklist: [
      'Define the union types.',
      'Include unsupported and truncation cases.',
      'Avoid any escape hatches.',
    ],
    acceptance: [
      'The type model covers current primitive output plus containers and fallback nodes.',
      'Future decoder work can use the model without broad casting.',
    ],
    verification: [
      'Compile against the new type model.',
      'Add focused type or unit tests for representative node shapes.',
    ],
  },
  {
    id: 'SSL-D17',
    title: 'Add decodeScVal to the worker API',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'A ping smoke method does not move the product toward real decoding.',
    context:
      'The decoder worker is wired with Comlink but exposes no real decode entrypoint.',
    scopeIn: [
      'Add one public decodeScVal method.',
      'Return the normalized node contract.',
    ],
    scopeOut: [
      'No complex decode coverage beyond supported cases.',
      'No caching.',
    ],
    checklist: [
      'Extend the worker API interface.',
      'Expose the new method.',
      'Return normalized output using the shared node model.',
    ],
    acceptance: [
      'The worker exposes decodeScVal.',
      'A smoke call returns normalized output for supported primitive inputs.',
    ],
    verification: [
      'Add or update a worker test.',
      'Call decodeScVal and assert on a simple primitive result.',
    ],
  },
  {
    id: 'SSL-D18',
    title: 'Add a main-thread helper for decodeScVal',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D17'],
    problem:
      'UI code should not need to know low-level Comlink details every time it needs a decode call.',
    context:
      'The worker factory exists, but there is no single helper wrapping the main-thread decode path.',
    scopeIn: [
      'Expose one typed helper for decodeScVal.',
      'Keep return types aligned with the normalized node contract.',
    ],
    scopeOut: ['No multi-worker orchestration.', 'No caching.'],
    checklist: [
      'Call the worker method from one helper.',
      'Return typed normalized results.',
      'Handle simple call-site errors.',
    ],
    acceptance: [
      'UI-side code can call one helper and receive a typed normalized result.',
      'The helper compiles without leaking Comlink-specific types into consumers.',
    ],
    verification: [
      'Add a focused test or smoke path.',
      'Call the helper and assert on a primitive decode result.',
    ],
  },
  {
    id: 'SSL-D19',
    title: 'Normalize i64 and u64 as decimal strings',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'Native JavaScript numbers cannot safely represent all 64-bit integer values.',
    context:
      'Large numeric ScVal variants still fall back as unsupported today.',
    scopeIn: ['Support i64 values.', 'Support u64 values.'],
    scopeOut: ['No pretty formatting.', 'No preference UI.'],
    checklist: [
      'Detect i64 and u64 values.',
      'Convert them to exact decimal strings.',
      'Keep original type metadata.',
    ],
    acceptance: [
      'Boundary values decode without precision loss.',
      'Results are represented as decimal strings, not JS numbers.',
    ],
    verification: [
      'Add tests for minimum, maximum, zero, and representative values.',
    ],
  },
  {
    id: 'SSL-D20',
    title: 'Normalize i128 and u128 as decimal strings',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      '128-bit Soroban integers are common for balances and must not lose precision.',
    context: 'Large integer support is still missing beyond i32 and u32.',
    scopeIn: ['Support i128 values.', 'Support u128 values.'],
    scopeOut: ['No pretty formatting.', 'No diff UI.'],
    checklist: [
      'Detect i128 and u128 values.',
      'Convert them to exact decimal strings.',
      'Keep original type metadata.',
    ],
    acceptance: [
      '128-bit boundary and sample values decode into exact decimal strings.',
      'Supported values stop falling back to unsupported results.',
    ],
    verification: [
      'Add tests for minimum, maximum, zero, and non-trivial values.',
    ],
  },
  {
    id: 'SSL-D21',
    title: 'Normalize i256 and u256 as decimal strings',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'Soroban also uses 256-bit numeric variants, and fallback-only behavior is not enough.',
    context:
      '256-bit integer variants are still unsupported in the current normalization layer.',
    scopeIn: ['Support i256 values.', 'Support u256 values.'],
    scopeOut: ['No pretty formatting.', 'No UI toggles.'],
    checklist: [
      'Detect i256 and u256 values.',
      'Convert them to exact decimal strings.',
      'Keep type metadata for later rendering and diffing.',
    ],
    acceptance: [
      'Supported 256-bit values decode as exact strings.',
      'These variants stop falling back to unsupported results.',
    ],
    verification: ['Add tests for zero and representative large values.'],
  },
  {
    id: 'SSL-D22',
    title: 'Add a bytes-to-hex helper',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'Raw byte values are unreadable without a deterministic display format.',
    context:
      'Byte variants are still unsupported, and later inspector work will need a reusable helper.',
    scopeIn: [
      'Convert byte input into stable hex output.',
      'Handle empty and non-empty values.',
    ],
    scopeOut: ['No base64 work.', 'No UI component.'],
    checklist: [
      'Accept the byte input shape used by the decoder.',
      'Return a stable hex string.',
      'Cover empty and non-empty byte arrays.',
    ],
    acceptance: [
      'Byte input converts to deterministic hex output.',
      'The helper covers empty, short, and longer values.',
    ],
    verification: [
      'Add tests for empty bytes.',
      'Add tests for short bytes.',
      'Add tests for a longer payload.',
    ],
  },
  {
    id: 'SSL-D23',
    title: 'Add a bytes-to-base64 helper',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'Base64 is a familiar byte representation for Stellar developers and should be available alongside hex.',
    context:
      'Byte variants still need reusable format helpers before inspector UI can expose them cleanly.',
    scopeIn: [
      'Convert byte input into deterministic base64 text.',
      'Handle empty and non-empty values.',
    ],
    scopeOut: ['No hex work.', 'No UI toggle.'],
    checklist: [
      'Accept the byte input shape used by the decoder.',
      'Return stable base64 text.',
      'Cover empty and typical values.',
    ],
    acceptance: [
      'Byte input converts to base64 consistently.',
      'The helper covers empty and non-empty values.',
    ],
    verification: [
      'Add tests for empty bytes.',
      'Add tests for short bytes.',
      'Add tests for a representative longer payload.',
    ],
  },
  {
    id: 'SSL-D24',
    title: 'Add a UTF-8 preview helper for bytes',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D22', 'SSL-D23'],
    problem:
      'Many byte payloads contain readable text, but the app should only show text previews when decoding is safe.',
    context:
      'Hex and base64 helpers are landing, but a readable preview is still missing.',
    scopeIn: [
      'Attempt UTF-8 decoding.',
      'Return readable text only when decoding is safe.',
    ],
    scopeOut: ['No byte-format preference UI.', 'No copy actions.'],
    checklist: [
      'Decode valid UTF-8.',
      'Return a null-like result on invalid text.',
      'Handle empty input cleanly.',
    ],
    acceptance: [
      'Valid UTF-8 returns text.',
      'Invalid byte sequences do not crash and do not masquerade as normal strings.',
    ],
    verification: [
      'Add tests for valid text bytes.',
      'Add tests for empty bytes.',
      'Add tests for invalid UTF-8 sequences.',
    ],
  },
  {
    id: 'SSL-D25',
    title: 'Normalize vectors into ordered child nodes',
    phase: 2,
    area: 'data',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'A state explorer cannot render nested contract data meaningfully until vectors become recursive tree nodes.',
    context: 'Container types still fall back as unsupported.',
    scopeIn: [
      'Normalize vector containers recursively.',
      'Preserve order and child paths.',
    ],
    scopeOut: ['No flattening.', 'No virtualized rendering.'],
    checklist: [
      'Detect ScVec values.',
      'Normalize each child recursively.',
      'Assign stable path segments using vector indices.',
    ],
    acceptance: [
      'Vector values normalize into ordered child nodes.',
      'Nested children preserve index-based paths.',
    ],
    verification: [
      'Add tests for empty vectors.',
      'Add tests for flat vectors.',
      'Add tests for nested vectors with mixed child types.',
    ],
  },
  {
    id: 'SSL-D26',
    title: 'Normalize maps into explicit key/value nodes',
    phase: 2,
    area: 'data',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem: 'Soroban map keys are not guaranteed to be plain strings.',
    context: 'Complex map values still fall back as unsupported today.',
    scopeIn: [
      'Normalize map entries as explicit key and value nodes.',
      'Preserve stable entry order.',
    ],
    scopeOut: ['No explorer flattening.', 'No schema overlay.'],
    checklist: [
      'Detect ScMap values.',
      'Normalize both key and value recursively.',
      'Preserve stable order from the source map.',
    ],
    acceptance: [
      'Map entries render as explicit key and value pairs.',
      'Non-string keys are not lost through object coercion.',
    ],
    verification: [
      'Add tests for scalar keys.',
      'Add tests for nested keys.',
      'Add tests for empty maps and mixed value types.',
    ],
  },
  {
    id: 'SSL-D27',
    title: 'Add a max-depth option to normalization',
    phase: 2,
    area: 'perf',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D25', 'SSL-D26'],
    problem:
      'Deep or hostile nested values should not be able to force unbounded recursive work.',
    context:
      'Recursive container support is being added and now needs a simple depth budget.',
    scopeIn: [
      'Add one normalization option for maximum recursion depth.',
      'Thread it through recursive decode calls.',
    ],
    scopeOut: [
      'No UI for changing the depth budget.',
      'No lazy load-more interaction.',
    ],
    checklist: [
      'Introduce an optional maxDepth setting.',
      'Check it during recursive normalization.',
      'Keep a sensible default.',
    ],
    acceptance: [
      'Recursive normalization respects the configured depth limit.',
      'Existing shallow values continue to decode normally.',
    ],
    verification: [
      'Add tests with shallow and deep nested values.',
      'Confirm behavior changes only when the depth limit is crossed.',
    ],
  },
  {
    id: 'SSL-D28',
    title: 'Return truncation placeholder nodes past max depth',
    phase: 2,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D27'],
    problem:
      'A depth limit is only useful if the user can see that deeper content was intentionally truncated.',
    context: 'Over-depth values still need a deterministic output shape.',
    scopeIn: [
      'Add one truncation placeholder node.',
      'Return it when max depth is exceeded.',
    ],
    scopeOut: ['No lazy load-more UI.', 'No custom truncation controls.'],
    checklist: [
      'Create a truncation node shape in the normalized union.',
      'Return it beyond the depth boundary.',
      'Keep path metadata intact.',
    ],
    acceptance: [
      'Over-depth values return a stable truncation node.',
      'The decoder does not throw or silently drop deep content.',
    ],
    verification: [
      'Add tests for the exact depth boundary.',
      'Add tests for the first level beyond it.',
    ],
  },
  {
    id: 'SSL-D29',
    title: 'Normalize account and contract addresses to StrKey text',
    phase: 2,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D16'],
    problem:
      'Raw Soroban address payloads are not usable to humans in a debugger.',
    context:
      'Address values still fall back as unsupported even though readable account and contract strings are core product output.',
    scopeIn: ['Support account addresses.', 'Support contract addresses.'],
    scopeOut: ['No copy-address UI.', 'No "You" label enrichment.'],
    checklist: [
      'Detect address variants.',
      'Convert them to the correct text format.',
      'Keep original address type metadata.',
    ],
    acceptance: [
      'Supported address variants normalize to readable text.',
      'Unsupported variants fail safely without crashing the worker.',
    ],
    verification: [
      'Add tests for account address fixtures.',
      'Add tests for contract address fixtures.',
    ],
  },
  {
    id: 'SSL-D30',
    title: 'Add a getLedgerEntries JSON-RPC helper with cancellation',
    phase: 3,
    area: 'network',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: [],
    problem:
      'Contract loading needs a focused RPC helper that can be aborted when the user changes routes or submits a new contract quickly.',
    context:
      'The app has no real network adapter yet for contract state reads.',
    scopeIn: ['Send getLedgerEntries requests.', 'Honor an AbortSignal.'],
    scopeOut: ['No polling loop.', 'No decode logic.'],
    checklist: [
      'Build the JSON-RPC request payload.',
      'Parse the response minimally.',
      'Stop work cleanly when the request is aborted.',
    ],
    acceptance: [
      'Successful calls return parsed data.',
      'Aborted calls do not commit stale results or throw unhandled errors into the UI.',
    ],
    verification: [
      'Add tests for a success case.',
      'Add tests for an abort case.',
      'Add tests for a failure case.',
    ],
  },
  {
    id: 'SSL-D31',
    title: 'Add active contract state to the global store',
    phase: 3,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem:
      'Contract-aware routes and actions need one canonical active contract value.',
    context:
      'Network, ledger data, and expanded nodes already exist in state, but active contract context does not.',
    scopeIn: ['Add activeContractId.', 'Add set and clear actions.'],
    scopeOut: ['No fetch logic.', 'No recent-contract history.'],
    checklist: [
      'Add the field to the store.',
      'Add set and clear actions.',
      'Keep unrelated slices unchanged.',
    ],
    acceptance: [
      'The store can set, clear, and read the active contract ID.',
      'The new field does not affect existing slices.',
    ],
    verification: [
      'Add store tests for initial state.',
      'Add tests for set and clear actions.',
    ],
  },
  {
    id: 'SSL-D32',
    title: 'Add contract load status state',
    phase: 3,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D31'],
    problem:
      'The UI needs an explicit fetch and decode lifecycle to render loading, empty, success, and error states.',
    context:
      'Explorer UI shells exist, but there is no contract-specific status field driving them.',
    scopeIn: [
      'Add load status lifecycle state.',
      'Expose set and reset actions.',
    ],
    scopeOut: ['No retry helper.', 'No route-level error boundary.'],
    checklist: [
      'Add the status enum.',
      'Include idle, loading, success, empty, and error states.',
      'Test the transitions.',
    ],
    acceptance: [
      'Contract load status can move through the expected lifecycle.',
      'Status transitions do not mutate active contract or stored ledger entries.',
    ],
    verification: [
      'Add store tests for default state.',
      'Add store tests for each explicit status transition.',
    ],
  },
  {
    id: 'SSL-D33',
    title: 'Map raw ledger responses into stored entry records',
    phase: 3,
    area: 'data',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16'],
    problem:
      'Raw RPC payloads are too inconsistent to render directly across explorer, inspector, history, and watchlist flows.',
    context:
      'The store already has a ledger entry shape, but there is no mapper from fetched RPC data into that shape.',
    scopeIn: [
      'Convert raw response data into the ledger entry record format.',
      'Preserve raw XDR when present.',
    ],
    scopeOut: ['No worker decode call.', 'No schema overlay.'],
    checklist: [
      'Extract the stable fields needed by the store.',
      'Preserve raw XDR when present.',
      'Return a consistent record when optional metadata is missing.',
    ],
    acceptance: [
      'Representative raw ledger responses map into stable stored records.',
      'Mapped records include contract context and raw payload where available.',
    ],
    verification: [
      'Add tests for typical contract data responses.',
      'Add tests for missing optional fields.',
      'Add tests for multiple-entry input.',
    ],
  },
  {
    id: 'SSL-D34',
    title:
      'Add a contract load action that fetches, decodes, and aborts stale requests',
    phase: 3,
    area: 'state',
    size: 'm',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D18', 'SSL-D30', 'SSL-D31', 'SSL-D32', 'SSL-D33'],
    problem:
      'The product needs one real pipeline from contract submit to store population.',
    context:
      'Route navigation, worker decode access, and raw RPC helpers are landing separately, but there is not yet a single action tying them together.',
    scopeIn: [
      'Take a contract ID and mark loading state.',
      'Fetch entries, decode them, and commit only the latest non-aborted result.',
    ],
    scopeOut: [
      'No polling refresh.',
      'No schema overlay or history snapshots.',
    ],
    checklist: [
      'Set active contract and loading state.',
      'Call the ledger helper.',
      'Decode returned values through the worker helper and ignore stale requests.',
    ],
    acceptance: [
      'A valid contract load updates store state end to end.',
      'Stale in-flight requests do not overwrite newer results.',
    ],
    verification: [
      'Add mocked integration coverage for success, empty, failure, and abort races.',
    ],
  },
  {
    id: 'SSL-D35',
    title: 'Add explorer loading skeleton rows',
    phase: 3,
    area: 'ui',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D34'],
    problem:
      'Contract loads should show progress instead of a blank or stale explorer panel.',
    context:
      'Explorer shell exists, but there is no dedicated loading presentation yet.',
    scopeIn: [
      'Render a simple loading skeleton pattern.',
      'Show it only during contract loading.',
    ],
    scopeOut: ['No shimmer redesign.', 'No perf instrumentation.'],
    checklist: [
      'Read the load status.',
      'Render a fixed number of skeleton rows.',
      'Keep the placeholder inside the existing explorer pane.',
    ],
    acceptance: [
      'Loading a contract shows skeleton rows immediately.',
      'Skeleton rows disappear once success, empty, or error state replaces them.',
    ],
    verification: [
      'Trigger a loading state manually or through a mocked fetch delay.',
      'Confirm the explorer pane shows skeleton rows only during loading.',
    ],
  },
  {
    id: 'SSL-D36',
    title: 'Add an explorer empty state card',
    phase: 3,
    area: 'ui',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D34'],
    problem:
      'Contracts that return no visible entries should render a useful empty state instead of a blank pane.',
    context:
      'The explorer does not distinguish between not loaded and loaded but empty.',
    scopeIn: [
      'Render one empty state card for the empty status.',
      'Keep it distinct from error and loading states.',
    ],
    scopeOut: ['No discovery CTA.', 'No watchlist integration.'],
    checklist: [
      'Render a short explanation.',
      'Mention that no contract data was found for the current query.',
      'Keep the state distinct from errors.',
    ],
    acceptance: [
      'A completed empty load shows a clear empty-state card.',
      'The explorer does not reuse loading or error UI for empty results.',
    ],
    verification: [
      'Mock an empty contract load.',
      'Confirm the explorer shows the empty state instead of blank space.',
    ],
  },
  {
    id: 'SSL-D37',
    title: 'Add an explorer error state card with retry',
    phase: 3,
    area: 'ui',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D34'],
    problem:
      'Failed contract loads should render a focused error state and one immediate next step.',
    context: 'Failures currently have no dedicated explorer UI.',
    scopeIn: [
      'Add an explorer error card.',
      'Add a retry action that re-runs the current contract load.',
    ],
    scopeOut: ['No bounded backoff helper.', 'No global error boundary.'],
    checklist: [
      'Render the error state only on load failure.',
      'Add a retry button.',
      'Wire retry to the existing contract load action.',
    ],
    acceptance: [
      'A failed load renders a clear error state.',
      'Pressing Retry re-attempts the current contract load.',
    ],
    verification: [
      'Mock a load failure.',
      'Confirm the error card appears and Retry runs the load action again.',
    ],
  },
  {
    id: 'SSL-D38',
    title: 'Define a flat tree row model',
    phase: 3,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D16', 'SSL-D31'],
    problem:
      'Virtualized rendering needs one flat visible-row contract separate from the nested normalized tree.',
    context: 'There is not yet a row model for the explorer viewport.',
    scopeIn: [
      'Define one row shape for visible explorer items.',
      'Include depth, key path, and child metadata.',
    ],
    scopeOut: ['No row rendering logic.', 'No virtualization component.'],
    checklist: [
      'Model the minimum fields a visible row needs.',
      'Keep it compatible with both primitive and container nodes.',
      'Avoid styling concerns in the type.',
    ],
    acceptance: [
      'The row type can represent primitives, containers, unsupported values, and truncation placeholders.',
      'The model is stable enough for flattening and row rendering.',
    ],
    verification: ['Add focused type or unit tests for representative rows.'],
  },
  {
    id: 'SSL-D39',
    title: 'Implement flattenTree from expanded node state',
    phase: 3,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D25', 'SSL-D26', 'SSL-D38'],
    problem:
      'A tree explorer cannot be virtualized efficiently until nested nodes can project into a flat visible row list.',
    context:
      'Normalized containers and expanded-node state exist separately, but there is no projection function joining them.',
    scopeIn: [
      'Walk normalized nodes in visible order.',
      'Hide collapsed descendants and keep stable row identity.',
    ],
    scopeOut: ['No UI renderer.', 'No search or filter behavior.'],
    checklist: [
      'Visit visible nodes in order.',
      'Include depth and path data.',
      'Hide collapsed descendants while preserving row identity.',
    ],
    acceptance: [
      'Expanded nodes expose descendants.',
      'Collapsed nodes hide them while row order remains deterministic.',
    ],
    verification: [
      'Add helper tests with nested maps and vectors.',
      'Cover different expanded-node combinations.',
    ],
  },
  {
    id: 'SSL-D40',
    title: 'Add flattenTree expand/collapse tests',
    phase: 3,
    area: 'qa',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D39'],
    problem:
      'Tree projection logic is easy to regress once selection, virtualization, and filters are added.',
    context: 'FlattenTree is a core helper and needs dedicated coverage.',
    scopeIn: [
      'Test collapsed root behavior.',
      'Test nested expansion and deterministic ordering.',
    ],
    scopeOut: ['No renderer snapshots.', 'No network mocks.'],
    checklist: [
      'Cover collapsed root and expanded root.',
      'Cover nested expansion.',
      'Cover mixed map and vector trees and deterministic row order.',
    ],
    acceptance: [
      'The test suite catches incorrect row counts.',
      'The test suite catches wrong row order and descendant leakage.',
    ],
    verification: [
      'Run the new flattenTree tests.',
      'Break one expansion rule locally and confirm the suite fails meaningfully.',
    ],
  },
  {
    id: 'SSL-D41',
    title: 'Add a virtualized tree list skeleton',
    phase: 3,
    area: 'perf',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D39'],
    problem:
      'Large contract state payloads will overwhelm the DOM if the explorer renders every row at once.',
    context:
      'The explorer still needs a viewport renderer designed for large lists.',
    scopeIn: [
      'Add one virtualized list shell.',
      'Render only the visible window of rows.',
    ],
    scopeOut: [
      'No search or filter behavior.',
      'No synchronized diff scrolling.',
    ],
    checklist: [
      'Choose the planned virtualization pattern or library.',
      'Render a minimal row window.',
      'Keep the API driven by flat rows.',
    ],
    acceptance: [
      'The list renders a subset of rows based on viewport position.',
      'The explorer no longer requires every row to mount at once.',
    ],
    verification: [
      'Mock a large row array.',
      'Confirm only a visible slice mounts in the DOM.',
    ],
  },
  {
    id: 'SSL-D42',
    title: 'Connect the virtualized list to flattened rows',
    phase: 3,
    area: 'perf',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D41'],
    problem:
      'A virtualized shell is not useful until it consumes real explorer row data.',
    context: 'FlattenTree and the virtualized shell are landing separately.',
    scopeIn: [
      'Feed flattened rows into the virtualized list.',
      'Update the list when expansion changes.',
    ],
    scopeOut: ['No search or filter behavior.', 'No diff highlighting.'],
    checklist: [
      'Read normalized tree data and expanded-node state.',
      'Derive flat rows.',
      'Pass them into the virtualized list.',
    ],
    acceptance: [
      'Expanding or collapsing nodes changes the row count in the virtualized explorer.',
      'Scroll rendering remains stable as rows change.',
    ],
    verification: [
      'Load mock tree data.',
      'Expand and collapse nodes.',
      'Confirm the rendered window updates correctly.',
    ],
  },
  {
    id: 'SSL-D43',
    title: 'Add a tree row renderer with indentation and expander',
    phase: 3,
    area: 'ui',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D42'],
    problem:
      'Virtualized rows still need a readable tree presentation with clear parent and child affordances.',
    context:
      'The explorer can reach a flat row list, but it still needs one reusable row renderer.',
    scopeIn: [
      'Render depth indentation.',
      'Render an expander only for rows with children.',
    ],
    scopeOut: ['No schema labels.', 'No diff badges.'],
    checklist: [
      'Indent by depth.',
      'Render the expander only when children exist.',
      'Keep the row interaction surface consistent.',
    ],
    acceptance: [
      'Rows visually reflect depth.',
      'Expandable rows show a control while leaf rows do not waste expander space.',
    ],
    verification: [
      'Render rows with different depths and child counts.',
      'Confirm indentation and expander behavior are correct.',
    ],
  },
  {
    id: 'SSL-D44',
    title: 'Add tree row value preview and type badge formatting',
    phase: 3,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D43'],
    problem:
      'A tree of keys alone is not enough; each row needs a short preview of its value and type.',
    context:
      'The row renderer is landing, but row content is still too sparse to help debugging.',
    scopeIn: [
      'Add short value preview formatting.',
      'Add type badge rendering for each row.',
    ],
    scopeOut: ['No schema-aware labels.', 'No diff status.'],
    checklist: [
      'Render primitive previews compactly.',
      'Show container and type badges consistently.',
      'Fall back safely for unsupported and truncated nodes.',
    ],
    acceptance: [
      'Rows show readable preview text for primitives.',
      'Rows show clear type badges for all row kinds.',
    ],
    verification: [
      'Render example rows for strings, numbers, maps, vectors, unsupported nodes, and truncation placeholders.',
    ],
  },
  {
    id: 'SSL-D45',
    title: 'Add selected key-path state and a select action',
    phase: 3,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D31'],
    problem:
      'Explorer and inspector behavior need one stable notion of which key path is currently selected.',
    context: 'There is no dedicated selection state for a focused row today.',
    scopeIn: ['Add one selected key-path field.', 'Add set and clear actions.'],
    scopeOut: ['No navigation.', 'No watchlist behavior.'],
    checklist: [
      'Add the field.',
      'Add set and clear actions.',
      'Keep selection independent from expansion state.',
    ],
    acceptance: [
      'The store can track one selected key path.',
      'Selection does not mutate ledger data or expansion state.',
    ],
    verification: [
      'Add store tests for selecting, replacing, and clearing the current key path.',
    ],
  },
  {
    id: 'SSL-D46',
    title: 'Scaffold the inspect route for a contract key',
    phase: 3,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D14'],
    problem:
      'Explorer row activation needs a real destination for key-level inspection.',
    context:
      'There is still no dedicated route for a single contract key path.',
    scopeIn: [
      'Add /contracts/:contractId/inspect/:keyPath.',
      'Render minimal context content.',
    ],
    scopeOut: ['No schema overlay.', 'No diff compare mode.'],
    checklist: [
      'Create the route.',
      'Read both route params.',
      'Render a stable inspect shell.',
    ],
    acceptance: [
      'Visiting the inspect route renders a contract-aware page.',
      'The route survives direct refresh.',
    ],
    verification: [
      'Open the inspect route directly in the browser.',
      'Refresh it and confirm the page still resolves.',
    ],
  },
  {
    id: 'SSL-D47',
    title: 'Navigate to inspect when a tree row is activated',
    phase: 3,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D43', 'SSL-D45', 'SSL-D46'],
    problem:
      'Explorer rows need to open the key inspector with one deterministic interaction.',
    context:
      'Row rendering, selected key-path state, and the inspect route are landing separately.',
    scopeIn: [
      'Select the row key path on activation.',
      'Route to the inspect page for that path.',
    ],
    scopeOut: ['No keyboard arrow navigation.', 'No watchlist pinning.'],
    checklist: [
      'Wire row activation to the selection action.',
      'Build the inspect route params.',
      'Preserve current contract context.',
    ],
    acceptance: [
      'Activating a row updates selection.',
      'Activating a row routes to the matching inspect page.',
    ],
    verification: [
      'Click a row in the explorer.',
      'Confirm both selected state and browser route update.',
    ],
  },
  {
    id: 'SSL-D48',
    title: 'Build inspector breadcrumb text from contract and key path',
    phase: 3,
    area: 'ui',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D46'],
    problem:
      'Inspect pages need obvious context and a quick way to understand where the current node lives.',
    context: 'The inspect route still lacks breadcrumb context.',
    scopeIn: [
      'Build breadcrumb text from route params.',
      'Render it in the inspect header.',
    ],
    scopeOut: ['No clickable ancestor navigation.', 'No search integration.'],
    checklist: [
      'Parse the key path into segments.',
      'Render a breadcrumb trail.',
      'Keep long paths readable.',
    ],
    acceptance: [
      'Inspect view shows contract context plus the current key path.',
      'Breadcrumb text remains readable for long paths.',
    ],
    verification: [
      'Open inspect pages with short and long key paths.',
      'Confirm the breadcrumb remains correct.',
    ],
  },
  {
    id: 'SSL-D49',
    title: 'Add an inspector metadata card for ledger details',
    phase: 3,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D46', 'SSL-D33'],
    problem:
      'Developers need the non-value context of a ledger entry, not just the decoded body.',
    context:
      'Stored ledger records already carry metadata such as durability and ledger fields, but the inspect view does not show them.',
    scopeIn: [
      'Render one metadata card.',
      'Show durability and ledger fields when available.',
    ],
    scopeOut: ['No diff metadata.', 'No schema mismatch warning.'],
    checklist: [
      'Read the current entry record.',
      'Display only fields that exist.',
      'Hide absent optional fields cleanly.',
    ],
    acceptance: [
      'Inspect view shows available ledger metadata clearly.',
      'Missing optional values do not render noisy placeholders.',
    ],
    verification: [
      'Open inspect with records that have optional metadata.',
      'Open inspect with records that do not have optional metadata.',
    ],
  },
  {
    id: 'SSL-D50',
    title: 'Add an inspector raw XDR card with copy action',
    phase: 3,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D46', 'SSL-D33'],
    problem:
      'A debugger should always preserve access to the raw payload when higher-level decoding is incomplete or suspect.',
    context:
      'Stored ledger records can carry raw XDR, but the inspect view does not expose it yet.',
    scopeIn: [
      'Render one raw XDR card.',
      'Add one copy action when raw payload is present.',
    ],
    scopeOut: ['No pretty-print decoder.', 'No binary diff UI.'],
    checklist: [
      'Read raw XDR from the current entry.',
      'Render it in a scroll-safe code block.',
      'Add a copy button and a clear fallback when raw XDR is missing.',
    ],
    acceptance: [
      'Inspect view shows raw XDR when available.',
      'Inspect view renders a non-error fallback when raw XDR is absent.',
    ],
    verification: [
      'Open inspect with an entry that includes raw XDR.',
      'Use the copy button.',
      'Test an entry without raw XDR and confirm the fallback state.',
    ],
  },
  {
    id: 'SSL-D51',
    title: 'Add a contract WASM fetch helper',
    phase: 4,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D30'],
    problem:
      'Schema-aware overlays cannot start until the app can fetch the contract code bytes.',
    context:
      'Contract state fetching is landing, but the separate code-fetch path required for schema extraction is still missing.',
    scopeIn: [
      'Retrieve contract WASM bytes for a contract ID.',
      'Return them in a stable shape.',
    ],
    scopeOut: ['No parsing of the spec section.', 'No schema UI.'],
    checklist: [
      'Build the required code request.',
      'Return raw WASM bytes.',
      'Normalize obvious fetch failures.',
    ],
    acceptance: [
      'Given a contract with available code, the helper returns WASM bytes.',
      'Failures produce handled error results instead of untyped crashes.',
    ],
    verification: [
      'Add mocked tests for success and failure.',
      'Confirm the returned bytes shape is stable.',
    ],
  },
  {
    id: 'SSL-D52',
    title: 'Extract contractspecv0 from WASM bytes',
    phase: 4,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D51'],
    problem:
      'Fetching WASM is not enough; the app specifically needs the contract spec section.',
    context:
      'The relevant custom section is not yet isolated from fetched WASM bytes.',
    scopeIn: [
      'Read the WASM module safely.',
      'Extract the contractspecv0 custom section payload when present.',
    ],
    scopeOut: ['No SCSpec parsing.', 'No schema labeling UI.'],
    checklist: [
      'Load the WASM module safely.',
      'Read the custom section.',
      'Return section bytes or a handled missing-section result.',
    ],
    acceptance: [
      'WASM with a contract spec returns the section payload.',
      'WASM without that section fails gracefully without crashing the app.',
    ],
    verification: [
      'Add tests with a fixture that contains the section.',
      'Add tests with a fixture that does not.',
    ],
  },
  {
    id: 'SSL-D53',
    title: 'Add parsed spec state keyed by contract ID',
    phase: 4,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D52'],
    problem:
      'Parsed schema data should be reusable across explorer and inspect views.',
    context:
      'There is no shared cache or state surface for contract specs today.',
    scopeIn: [
      'Add one store slice keyed by contract ID.',
      'Store parsed or lookup-ready schema data.',
    ],
    scopeOut: [
      'No UI rendering.',
      'No invalidation policy beyond simple replace behavior.',
    ],
    checklist: [
      'Add set and get actions.',
      'Store schema data by contract ID.',
      'Keep the slice separate from raw ledger entry data.',
    ],
    acceptance: [
      'Parsed spec data can be stored and retrieved per contract.',
      'The slice does not affect other store state.',
    ],
    verification: [
      'Add store tests for saving and replacing spec data.',
      'Cover multiple contract IDs.',
    ],
  },
  {
    id: 'SSL-D54',
    title: 'Resolve enum labels from parsed spec entries',
    phase: 4,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D53'],
    problem:
      'Numeric enum values are far more useful when shown with their semantic labels.',
    context:
      'There is not yet any lookup logic that maps stored values to enum names.',
    scopeIn: [
      'Build an enum lookup map from parsed specs.',
      'Return labels for matching enum values.',
    ],
    scopeOut: ['No struct field labeling.', 'No mismatch logic.'],
    checklist: [
      'Build a lookup map from parsed spec entries.',
      'Return labels for matching enum values.',
      'Fall back cleanly when no match exists.',
    ],
    acceptance: [
      'Known enum values resolve to labels.',
      'Unknown or non-enum values leave the UI on the raw value path.',
    ],
    verification: [
      'Add tests for matching enum values.',
      'Add tests for missing labels and mismatched types.',
    ],
  },
  {
    id: 'SSL-D55',
    title: 'Resolve struct field labels for tuple indices and symbol keys',
    phase: 4,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D53'],
    problem:
      'Stored tuples and map-like field layouts are hard to read without semantic field names.',
    context:
      'Explorer rows and inspect view still show raw tuple indices and key symbols only.',
    scopeIn: [
      'Map tuple indices to field labels when possible.',
      'Map matching symbol keys to field labels when possible.',
    ],
    scopeOut: ['No version-mismatch warning.', 'No full schema editor.'],
    checklist: [
      'Build field label lookup logic from parsed struct definitions.',
      'Support index-based cases.',
      'Support symbol-key cases and return no label when matching is ambiguous.',
    ],
    acceptance: [
      'Supported struct-backed values can resolve field labels.',
      'Unmatched values continue to render safely without guessed labels.',
    ],
    verification: [
      'Add tests for tuple-based structs.',
      'Add tests for symbol-key structs.',
      'Add tests for ambiguous or missing-field cases.',
    ],
  },
  {
    id: 'SSL-D56',
    title: 'Detect schema mismatch and show a warning banner',
    phase: 4,
    area: 'ui',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D54', 'SSL-D55'],
    problem:
      'The debugger must warn when stored data no longer matches the current contract schema.',
    context:
      'Enum and field-label lookups are landing, but there is still no graceful mismatch fallback path.',
    scopeIn: [
      'Detect obvious schema mismatches.',
      'Show a warning banner while preserving raw data visibility.',
    ],
    scopeOut: ['No migration hints.', 'No contract-version history viewer.'],
    checklist: [
      'Add mismatch detection rules for obvious shape conflicts.',
      'Set a visible warning state.',
      'Keep raw data rendering active when mismatch is detected.',
    ],
    acceptance: [
      'Mismatched data shows a clear warning banner.',
      'Mismatch does not prevent raw node rendering in explorer and inspect.',
    ],
    verification: [
      'Feed a deliberately mismatched schema and data pair.',
      'Confirm the warning appears while raw values remain visible.',
    ],
  },
  {
    id: 'SSL-D57',
    title: 'Scaffold the discovery route for a contract',
    phase: 5,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D14'],
    problem:
      'Simulation-based key discovery needs its own route instead of being buried inside the main explorer shell.',
    context: 'There is still no route dedicated to discovery workflows.',
    scopeIn: [
      'Add /contracts/:contractId/discovery.',
      'Render minimal contract-aware shell content.',
    ],
    scopeOut: ['No simulation calls.', 'No footprint parsing.'],
    checklist: [
      'Create the route.',
      'Render contract-aware discovery placeholder content.',
      'Keep it refresh-safe.',
    ],
    acceptance: [
      'Visiting the discovery route renders a stable page with contract context.',
      'The route survives direct refresh.',
    ],
    verification: [
      'Open the discovery route directly in the browser.',
      'Refresh it and confirm the route still resolves.',
    ],
  },
  {
    id: 'SSL-D58',
    title: 'Add simulation form state for function name and JSON args',
    phase: 5,
    area: 'state',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D57'],
    problem:
      'Discovery needs a controlled input model before it can validate or submit simulation requests.',
    context:
      'The discovery route shell lacks state for the function call users want to simulate.',
    scopeIn: [
      'Add controlled state for function name.',
      'Add controlled state for args JSON text and a simple submit lifecycle.',
    ],
    scopeOut: [
      'No actual simulation request.',
      'No schema-aware argument typing.',
    ],
    checklist: [
      'Add fields for function name and args text.',
      'Track idle, loading, success, and error state or equivalent.',
      'Expose simple update and reset actions.',
    ],
    acceptance: [
      'The discovery form can hold and update both inputs predictably.',
      'Form state does not leak across route changes.',
    ],
    verification: [
      'Open discovery and type into both fields.',
      'Clear or reset them and confirm the values update correctly.',
    ],
  },
  {
    id: 'SSL-D59',
    title: 'Add a function name validator for discovery',
    phase: 5,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D58'],
    problem:
      'Discovery should block obviously malformed function names before hitting RPC simulation.',
    context:
      'The discovery form state exists, but there is no focused validator for the function name field.',
    scopeIn: [
      'Validate the function name string.',
      'Return a clear valid or invalid result.',
    ],
    scopeOut: ['No JSON args validation.', 'No RPC work.'],
    checklist: [
      'Trim the input.',
      'Reject blank values and invalid characters.',
      'Accept normal contract function naming patterns.',
    ],
    acceptance: [
      'Blank and malformed function names fail validation.',
      'Expected contract function names pass.',
    ],
    verification: [
      'Add tests for blank strings.',
      'Add tests for invalid characters.',
      'Add tests for representative valid names.',
    ],
  },
  {
    id: 'SSL-D60',
    title: 'Add a JSON args validator for discovery',
    phase: 5,
    area: 'data',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D58'],
    problem:
      'Invalid JSON arguments should fail in the form before RPC simulation is attempted.',
    context: 'The args field currently has no structured validation.',
    scopeIn: [
      'Validate args text as JSON.',
      'Return a clear pass or fail result.',
    ],
    scopeOut: [
      'No semantic argument typing against the contract spec.',
      'No RPC work.',
    ],
    checklist: [
      'Parse the text safely.',
      'Surface invalid JSON cleanly.',
      'Handle the chosen empty-input behavior explicitly.',
    ],
    acceptance: [
      'Valid JSON input passes.',
      'Invalid JSON fails without crashing the page.',
    ],
    verification: [
      'Add tests for valid objects and arrays.',
      'Add tests for malformed JSON.',
      'Add tests for the expected empty-input behavior.',
    ],
  },
  {
    id: 'SSL-D61',
    title: 'Add a simulateTransaction request helper',
    phase: 5,
    area: 'network',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D30'],
    problem:
      'Discovery cannot harvest unknown keys until the app can call Soroban simulation directly.',
    context:
      'The discovery route and input validation are landing, but there is still no RPC helper for simulation.',
    scopeIn: [
      'Send a simulation request.',
      'Return the parsed response in a stable shape.',
    ],
    scopeOut: ['No UI rendering.', 'No footprint extraction in this issue.'],
    checklist: [
      'Build the JSON-RPC request payload.',
      'Normalize obvious request failures.',
      'Return the response fields needed by later discovery steps.',
    ],
    acceptance: [
      'A valid simulation request returns parsed data.',
      'Request failures produce handled error results instead of untyped crashes.',
    ],
    verification: [
      'Add mocked tests for a success response.',
      'Add mocked tests for a failure response.',
    ],
  },
  {
    id: 'SSL-D62',
    title: 'Extract read and write footprint keys from simulation results',
    phase: 5,
    area: 'data',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D61'],
    problem:
      'Simulation is only useful for discovery once the app can turn the response footprint into a list of candidate keys.',
    context: 'The returned payload still needs focused key extraction logic.',
    scopeIn: [
      'Extract read footprint keys.',
      'Extract write footprint keys and dedupe them.',
    ],
    scopeOut: [
      'No watchlist integration.',
      'No automatic fetch of every discovered key.',
    ],
    checklist: [
      'Parse the relevant footprint sections.',
      'Normalize keys into one stable identity shape.',
      'Dedupe repeated keys.',
    ],
    acceptance: [
      'Read and write footprint keys are extracted correctly.',
      'Keys are deduped and returned in a predictable order and shape.',
    ],
    verification: [
      'Add tests for read-only payloads.',
      'Add tests for write-only payloads.',
      'Add tests for mixed and duplicate-key payloads.',
    ],
  },
  {
    id: 'SSL-D63',
    title:
      'Add a discovery result list with loading/error states and open-in-explorer action',
    phase: 5,
    area: 'ui',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D57', 'SSL-D62'],
    problem:
      'Extracted keys need a visible workflow so users can move from discovery into actual state inspection.',
    context:
      'There is still no result UI for successful or failed discovery attempts.',
    scopeIn: [
      'Render loading, error, and success states.',
      'List discovered keys with an action to open a selected key in contract browsing flow.',
    ],
    scopeOut: [
      'No watchlist pinning.',
      'No automatic fetch of every discovered key.',
    ],
    checklist: [
      'Show loading and error states.',
      'Render deduped discovered keys on success.',
      'Wire one action that routes the user back into contract exploration.',
    ],
    acceptance: [
      'Running discovery shows a clear lifecycle.',
      'Successful keys are listed and choosing one opens it in the contract browsing flow.',
    ],
    verification: [
      'Mock successful and failed discovery results.',
      'Confirm lifecycle states and the open action behave correctly.',
    ],
  },
  {
    id: 'SSL-D64',
    title: 'Scaffold the history route for a contract',
    phase: 6,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D14'],
    problem:
      'Snapshot and diff work needs a dedicated route instead of being hidden inside unrelated pages.',
    context: 'There is still no contract history route.',
    scopeIn: [
      'Add /contracts/:contractId/history.',
      'Render minimal contract-aware shell content.',
    ],
    scopeOut: ['No diff engine.', 'No snapshot capture action yet.'],
    checklist: [
      'Create the route.',
      'Show contract-aware placeholder content.',
      'Keep the route refresh-safe.',
    ],
    acceptance: [
      'Visiting the history route renders a stable page with contract context.',
      'The route survives direct refresh.',
    ],
    verification: [
      'Open the history route directly in the browser.',
      'Refresh it and confirm the route still resolves.',
    ],
  },
  {
    id: 'SSL-D65',
    title: 'Add a snapshot store slice keyed by contract',
    phase: 6,
    area: 'state',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D31'],
    problem:
      'History features need a dedicated state surface for captured contract snapshots.',
    context: 'There is no snapshot slice in the store yet.',
    scopeIn: [
      'Add a slice keyed by contract ID.',
      'Hold a list of immutable snapshots.',
    ],
    scopeOut: ['No diff computation.', 'No persistence across reloads.'],
    checklist: [
      'Define a snapshot record shape.',
      'Add add and list actions.',
      'Keep snapshot data separate from live ledger entry state.',
    ],
    acceptance: [
      'Snapshots can be stored and read per contract.',
      'The slice does not mutate live contract data.',
    ],
    verification: [
      'Add store tests for adding multiple snapshots.',
      'Cover multiple contract IDs.',
    ],
  },
  {
    id: 'SSL-D66',
    title: 'Add a snapshot capture action for current contract state',
    phase: 6,
    area: 'state',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D34', 'SSL-D65'],
    problem:
      'History is not useful until users can freeze the current state at a moment in time.',
    context:
      'Live contract state is already held in the store, but there is no capture action yet.',
    scopeIn: [
      'Clone the current contract state into a new snapshot.',
      'Attach timestamped snapshot metadata.',
    ],
    scopeOut: ['No compare UI.', 'No named snapshot editing.'],
    checklist: [
      'Read the active contract and current loaded entries.',
      'Clone them immutably.',
      'Append a timestamped snapshot record to the snapshot slice.',
    ],
    acceptance: [
      'Capturing a snapshot stores an immutable copy.',
      'Stored snapshots do not change when live state changes later.',
    ],
    verification: [
      'Capture a snapshot.',
      'Mutate the live state.',
      'Confirm the stored snapshot remains unchanged.',
    ],
  },
  {
    id: 'SSL-D67',
    title: 'Build a semantic diff helper for normalized entries',
    phase: 6,
    area: 'data',
    size: 'm',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D16', 'SSL-D65'],
    problem: 'Snapshot compare requires more than raw string comparison.',
    context: 'There is still no diff engine over snapshot contents.',
    scopeIn: [
      'Compare two snapshot entry sets.',
      'Classify created, deleted, modified, and unchanged cases using normalized data.',
    ],
    scopeOut: ['No visual diff tree.', 'No synchronized compare panes.'],
    checklist: [
      'Compare keys present in each snapshot.',
      'Detect created, deleted, modified, and unchanged cases.',
      'Compare normalized values deeply enough for semantic equality.',
    ],
    acceptance: [
      'The helper correctly classifies representative snapshot differences.',
      'The helper avoids false positives on semantically unchanged data.',
    ],
    verification: [
      'Add tests covering created, deleted, modified, and unchanged entry cases.',
    ],
  },
  {
    id: 'SSL-D68',
    title: 'Add a history empty state and diff summary card',
    phase: 6,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D64', 'SSL-D65', 'SSL-D67'],
    problem:
      'Users need clear feedback both when there is nothing to compare and when a compare result is available.',
    context: 'There is no user-facing state for history and diff yet.',
    scopeIn: [
      'Render an empty state when fewer than two snapshots exist.',
      'Render a compact summary card when diff data is available.',
    ],
    scopeOut: ['No full changed-node browser.', 'No split-pane diff viewer.'],
    checklist: [
      'Detect insufficient snapshots.',
      'Show a capture-first message.',
      'Show counts for created, deleted, modified, and unchanged entries when diff data exists.',
    ],
    acceptance: [
      'History shows a clear empty state before enough snapshots exist.',
      'History shows a readable summary after a compare result is available.',
    ],
    verification: [
      'Visit history with zero or one snapshot.',
      'Visit it with two snapshots and a mocked diff result.',
    ],
  },
  {
    id: 'SSL-D69',
    title: 'Add a watchlist store slice with add/remove actions',
    phase: 7,
    area: 'state',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D31'],
    problem:
      'Developers need a small set of pinned keys they can return to quickly across routes.',
    context: 'There is no shared watchlist state yet.',
    scopeIn: [
      'Add a watchlist slice keyed by contract ID.',
      'Support add and remove actions with duplicate protection.',
    ],
    scopeOut: ['No route UI.', 'No persistence across reloads.'],
    checklist: [
      'Define a watchlist item shape.',
      'Add add and remove actions.',
      'Dedupe by contract ID plus key path.',
    ],
    acceptance: [
      'Keys can be pinned and removed per contract.',
      'Adding the same key twice does not create duplicates.',
    ],
    verification: [
      'Add store tests for add, remove, and duplicate cases across multiple contracts.',
    ],
  },
  {
    id: 'SSL-D70',
    title: 'Scaffold the watchlist route with empty state and inspect action',
    phase: 7,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D14', 'SSL-D69'],
    problem:
      'Pinned keys need a dedicated destination instead of living only as hidden store state.',
    context: 'There is still no watchlist page.',
    scopeIn: [
      'Add /contracts/:contractId/watchlist.',
      'Render either an empty state or a simple list with an inspect action.',
    ],
    scopeOut: ['No sorting rules.', 'No change-status badges.'],
    checklist: [
      'Create the route.',
      'Read watchlist items for the active contract.',
      'Show an empty state when none exist and add one inspect action per item.',
    ],
    acceptance: [
      'The watchlist route resolves cleanly.',
      'The route shows a helpful empty state and allows navigation to inspect for saved items.',
    ],
    verification: [
      'Visit the route with no items.',
      'Add a watchlist item and confirm the list and inspect action render.',
    ],
  },
  {
    id: 'SSL-D71',
    title: 'Add Add-to-watchlist actions in discovery results and inspector',
    phase: 7,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D50', 'SSL-D63', 'SSL-D69'],
    problem:
      'Watchlists are only useful if users can pin keys from the workflows where they discover or inspect them.',
    context:
      'Discovery results, inspector view, and watchlist state are landing separately.',
    scopeIn: [
      'Add one pin action in discovery results.',
      'Add one pin action in inspect view backed by the watchlist slice.',
    ],
    scopeOut: [
      'No remove action outside the watchlist route.',
      'No persistence across reloads.',
    ],
    checklist: [
      'Add the pin action to both surfaces.',
      'Pass contract ID and key path into the watchlist slice.',
      'Keep duplicate adds harmless.',
    ],
    acceptance: [
      'Users can pin a discovered or inspected key.',
      'Repeated pin attempts do not create duplicate watchlist items.',
    ],
    verification: [
      'Pin the same key from discovery and inspect.',
      'Confirm the watchlist still contains one item.',
    ],
  },
  {
    id: 'SSL-D72',
    title: 'Scaffold the settings network route with a saved RPC summary',
    phase: 7,
    area: 'ui',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: ['SSL-D03'],
    problem:
      'Network configuration should have a dedicated settings surface instead of living only in the header selector.',
    context:
      'There is still no route for reviewing saved network configuration.',
    scopeIn: [
      'Add /settings/network.',
      'Render a summary of the currently saved preset and custom RPC configuration.',
    ],
    scopeOut: [
      'No provider API key support.',
      'No advanced diagnostics history.',
    ],
    checklist: [
      'Create the route.',
      'Read saved network state.',
      'Render current preset and custom values plus connection-status summary if present.',
    ],
    acceptance: [
      'Visiting settings/network shows the current saved network config in a dedicated route.',
      'The summary reflects current stored settings after refresh.',
    ],
    verification: [
      'Change the saved network config.',
      'Visit the route and refresh it.',
      'Confirm the summary reflects current state.',
    ],
  },
  {
    id: 'SSL-D73',
    title: 'Add preferences state and scaffold the settings preferences route',
    phase: 7,
    area: 'state',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem:
      'Byte-view and big-integer formatting choices need a home in app state before later display preferences can be respected consistently.',
    context:
      'There is still no preferences state or route for bytes and bigint display modes.',
    scopeIn: [
      'Add preference state for byte and bigint display modes.',
      'Create /settings/preferences to edit those values.',
    ],
    scopeOut: [
      'No full application of those preferences across every viewer in this issue.',
      'No theme settings.',
    ],
    checklist: [
      'Define default preference values.',
      'Add set and reset actions.',
      'Scaffold a settings page with selectors for byte mode and bigint mode.',
    ],
    acceptance: [
      'Users can view and change byte and bigint display preferences in one route.',
      'Chosen values update shared preference state.',
    ],
    verification: [
      'Visit settings/preferences.',
      'Change both selectors.',
      'Confirm shared preference state updates correctly.',
    ],
  },
  {
    id: 'SSL-D74',
    title: 'Add a bounded retry/backoff helper for RPC 429 and 5xx responses',
    phase: 7,
    area: 'network',
    size: 'xs',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: ['SSL-D30'],
    problem:
      'Public Soroban RPC endpoints can rate-limit or fail transiently, and the app needs one reusable retry rule instead of ad hoc error handling.',
    context:
      'Network helpers are landing, but there is still no shared backoff policy for retryable failures.',
    scopeIn: [
      'Retry only retryable HTTP or JSON-RPC failures.',
      'Cap attempts with a small bounded backoff policy.',
    ],
    scopeOut: ['No automatic polling loop.', 'No user-facing countdown UI.'],
    checklist: [
      'Retry only 429 and retryable 5xx failures.',
      'Cap the number of attempts.',
      'Surface the final failure clearly when retries are exhausted.',
    ],
    acceptance: [
      'Retryable failures are retried up to the configured cap.',
      'Non-retryable failures are not retried.',
    ],
    verification: [
      'Add tests for success-after-retry.',
      'Add tests for retry exhaustion.',
      'Add tests for a non-retryable failure.',
    ],
  },
  {
    id: 'SSL-D75',
    title: 'Trap focus and support Escape-close in the mobile sidebar',
    phase: 7,
    area: 'qa',
    size: 's',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem:
      'The mobile explorer drawer is currently only partially accessible for keyboard users.',
    context:
      'The app already has a mobile sidebar overlay, but it still needs keyboard-safe focus handling.',
    scopeIn: [
      'Keep focus inside the open mobile sidebar.',
      'Close it on Escape and return focus to the opener.',
    ],
    scopeOut: [
      'No redesign of sidebar content.',
      'No desktop navigation changes.',
    ],
    checklist: [
      'Capture the opener element.',
      'Trap focus while the drawer is open.',
      'Restore focus to the opener on close.',
    ],
    acceptance: [
      'Opening the mobile drawer traps keyboard focus inside it.',
      'Pressing Escape closes it and returns focus to the trigger button.',
    ],
    verification: [
      'Test the drawer with keyboard only on a mobile viewport.',
      'Confirm tab order, Escape close, and focus restoration.',
    ],
  },
]
