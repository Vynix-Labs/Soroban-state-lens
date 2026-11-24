// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('web app toolchain', () => {
  it('builds the decoder without Rust tools', () => {
    const temp = mkdtempSync(join(tmpdir(), 'web-no-rust-'))
    const marker = join(temp, 'rust-invoked')
    try {
      for (const tool of ['cargo', 'rustc']) {
        writeFileSync(
          join(temp, tool),
          `#!/bin/sh\nprintf invoked > "$RUST_TEST_MARKER"\nexit 1\n`,
          { mode: 0o755 },
        )
      }
      execFileSync(
        process.execPath,
        [
          'node_modules/vite/bin/vite.js',
          'build',
          '--outDir',
          join(temp, 'dist'),
        ],
        {
          env: {
            ...process.env,
            PATH: [temp, process.env.PATH].join(delimiter),
            RUST_TEST_MARKER: marker,
          },
          stdio: 'pipe',
          timeout: 60000,
        },
      )
      expect(() => readFileSync(marker)).toThrow()
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }, 70000)
})
