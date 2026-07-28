# Contributing to Soroban State Lens

Thanks for helping improve Soroban State Lens. Small, focused pull requests are
welcome.

## Prerequisites

- Node.js 20 or newer
- Bun 1.0 or newer
- Rust, required by the Rust-based XDR decoder

Run `bun run check:env` to verify the Node.js and Bun versions.

## Set up locally

```bash
git clone https://github.com/Vynix-Labs/Soroban-state-lens.git
cd Soroban-state-lens
bun install
```

Start the development server with `bun run dev`.

## Checks

Run the relevant checks before opening a pull request:

```bash
bun run test
bun run lint
bun run format -- --check
bun run build
```

`bun run format` without `-- --check` formats files in place. Use the
repository's existing formatting configuration and keep generated route files
up to date when routes change.

## Branches and pull requests

1. Fork the repository and create a descriptive branch from `main`, such as
   `fix/rpc-error-state` or `docs/contributing-guide`.
2. Keep each pull request focused on one issue.
3. Add or update tests for behavior changes.
4. Explain what changed, how it was tested, and link the related issue.
5. Target the upstream `main` branch.

Good first issues are listed with the
[`good first issue`](https://github.com/Vynix-Labs/Soroban-state-lens/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
label.
