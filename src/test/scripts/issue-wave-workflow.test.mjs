import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('issue-wave workflow documentation', () => {
  it('documents catalog conventions, labels, deduplication, and verification', () => {
    const guide = readFileSync(
      join(process.cwd(), 'docs/ISSUE_WAVE_WORKFLOW.md'),
      'utf8',
    )

    expect(guide).toContain('scripts/github-issues-data.mjs')
    expect(guide).toContain('good first issue')
    expect(guide).toContain('same title')
    expect(guide).toContain('bun run issues:publish')
  })
})
