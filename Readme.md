# **🔍 Soroban State Lens**

**Soroban State Lens** is a high-performance, open-source visual debugger and state explorer for Soroban smart contracts. It transforms raw, encoded ledger entries into a human-readable, navigable tree structure, allowing developers to peer into their contract's "memory" in real-time.

## **💡 The Problem**

Soroban stores data in the ledger as ScVal (Stellar Contract Values) within ContractData entries. When debugging complex storage patterns (like nested Maps, Vectors, or custom UDTs), the standard CLI output can be difficult to parse, especially when trying to track state changes across multiple ledger closes.

## **✨ Features**

- **Live State Tree:** Connect to any RPC endpoint (Local, Testnet, Mainnet) and view contract data updated every ledger close.
- **Deep Decoding:** Recursively decodes XDR-encoded ScVal into JSON-like structures using a dedicated Web Worker.
- **Wasm-Spec Awareness:** Upload your .wasm or provide a ContractID to automatically fetch and apply the contract's metadata for labeled field names.
- **Historical Snapshots:** Compare "Before vs. After" states of a contract after a transaction invocation with visual diffing.
- **Footprint Simulation:** Discover storage keys by simulating transactions and "harvesting" the read/write footprint.

## **🚀 Getting Started**

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v20+) — Use [nvm](https://github.com/nvm-sh/nvm) to manage versions
- [Bun](https://bun.sh/) (v1.0+) — Fast all-in-one JavaScript runtime
- [Rust](https://www.rust-lang.org/) (required for the Rust-based XDR decoder)
- A running Soroban RPC node (or use the public Testnet/Mainnet endpoints)

### **Stack & Architecture**

- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based routing in `src/routes`)
- **Soroban RPC**: Fetch-based helpers in `src/lib/network` for ledger reads, simulation, and retries
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) (`src/store/lensStore.ts`)
- **Stellar UI & XDR**: [`@stellar/design-system`](https://github.com/stellar/stellar-design-system) and [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk)

### **Installation**

1. Clone the repository:  
   `git clone https://github.com/Vynix-Labs/soroban-state-lens.git`  
   `cd soroban-state-lens`

2. Verify your environment versions:  
   `npm run check:env` or `bun run check:env`  
   This ensures you have Node.js v20+ and Bun v1.0+ installed.

3. Install dependencies:  
   `bun install` or `npm install`

4. Start the development server:  
   `npm run dev` or `bun run dev`

## **🛠 Project Architecture**

The project is split into three main layers:

1. **The Scraper:** Periodically polls the RPC getLedgerEntries method for a specific ContractID.
2. **The Decoder:** A Web Worker handling heavy XDR parsing and mapping raw bytes to the contract's Interface Specification (IDL).
3. **The Visualizer:** A **React** frontend using @stellar/design-system, Zustand for state, and Stellar SDK helpers for rendering decoded contract data.

## **🗺 Roadmap**

The backlog is organized around the [phase:0](https://github.com/Vynix-Labs/Soroban-state-lens/labels/phase%3A0) through [phase:7](https://github.com/Vynix-Labs/Soroban-state-lens/labels/phase%3A7) labels. Each phase groups related work so contributors can pick tasks that match their skills and the current milestone.

- **Phase 0 — Test Foundation:** Restore and stabilize the Vitest browser-mode test harness.
- **Phase 1 — Explorer Scaffolding:** Scaffold the contract explorer route, validate inputs, and persist user preferences and watchlists.
- **Phase 2 — Decoding Utilities:** Build formatting helpers and worker-driven ScVal decoding for maps, vectors, and primitive types.
- **Phase 3 — Explorer Interaction:** Add tree controls, row previews, and navigation between explorer and inspect views.
- **Phase 4 — Spec & Labeling:** Parse contract specs from WASM, resolve struct/enum labels, and surface schema-mismatch warnings.
- **Phase 5 — Discovery & Simulation:** Simulate transactions, extract footprints, and provide a discovery UI for callable contract functions.
- **Phase 6 — History & Diff:** Capture snapshots, compute semantic diffs, and present history empty states and summary cards.
- **Phase 7 — Polish & Tests:** Add component-level tests, pull-request templates, and other repository hygiene.

## **🤝 Contributing**

The catalog and publishing checks are documented in the
[contributor issue-wave workflow](docs/ISSUE_WAVE_WORKFLOW.md).

We love contributors\! Whether you are a Rustacean who loves XDR or a Frontend dev with an eye for UX:

1. Check the [Issues](https://github.com/Vynix-Labs/Soroban-state-lens/issues) for "Good First Issue" tags.
2. Fork the repo and create your branch.
3. Submit a PR with a detailed description of your changes.

## **📄 License**

Distributed under the MIT License. See LICENSE for more information.

_Built with ❤️ for the Stellar Developer Community._
