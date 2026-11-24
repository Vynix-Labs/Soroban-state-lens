// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'

it('excludes the worker ping helper from generated routes', () => {
  const output = mkdtempSync(join(tmpdir(), 'route-build-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['node_modules/vite/bin/vite.js', 'build', '--outDir', output],
      { encoding: 'utf8', timeout: 60000 },
    )
    expect(result.status, result.stderr).toBe(0)
    expect(result.stderr).not.toContain('initializeDecoderWorkerPing')
    expect(readFileSync('src/routeTree.gen.ts', 'utf8')).not.toContain(
      'initializeDecoderWorkerPing',
    )
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
}, 70000)
