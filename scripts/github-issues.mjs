import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { issues } from './github-issues-data.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const backlogDir = path.join(repoRoot, 'backlog')
const backlogJsonPath = path.join(backlogDir, 'github-issues.json')

function getLabels(issue) {
  const labels = ['enhancement', 'help wanted']
  if (issue.goodFirst) {
    labels.push('good first issue')
  }
  labels.push(
    `phase:${issue.phase}`,
    `area:${issue.area}`,
    `size:${issue.size}`,
    `difficulty:${issue.difficulty}`,
  )
  return labels
}

function renderList(items) {
  return items.map((item) => `- ${item}`).join('\n')
}

function renderIssueBody(issue) {
  return [
    '1. Title',
    issue.title,
    '',
    '2. Problem / Why',
    issue.problem,
    '',
    '3. Current Product Context',
    issue.context,
    '',
    '4. Scope In',
    renderList(issue.scopeIn),
    '',
    '5. Scope Out',
    renderList(issue.scopeOut),
    '',
    '6. Implementation Checklist',
    renderList(issue.checklist),
    '',
    '7. Acceptance Criteria',
    renderList(issue.acceptance),
    '',
    '8. Verification Steps',
    renderList(issue.verification),
    '',
    '9. Dependencies',
    issue.dependencies.length ? renderList(issue.dependencies) : '- None.',
    '',
    '10. Suggested Labels',
    renderList(getLabels(issue)),
    '',
    '11. Definition of Done',
    '- The scoped change is merged, the acceptance criteria are met, and the relevant local checks pass.',
  ].join('\n')
}

function writeBacklogJson() {
  mkdirSync(backlogDir, { recursive: true })
  const payload = {
    generatedAt: new Date().toISOString(),
    count: issues.length,
    issues: issues.map((issue) => ({
      ...issue,
      labels: getLabels(issue),
      body: renderIssueBody(issue),
    })),
  }

  writeFileSync(backlogJsonPath, `${JSON.stringify(payload, null, 2)}\n`)
}

function getLabelConfig(name) {
  if (name === 'good first issue') {
    return {
      color: '7057ff',
      description: 'Good starter task for new contributors',
    }
  }
  if (name === 'enhancement') {
    return { color: 'a2eeef', description: 'New feature or improvement' }
  }
  if (name === 'help wanted') {
    return { color: '008672', description: 'Extra attention is needed' }
  }
  if (name.startsWith('phase:')) {
    const phase = Number(name.split(':')[1] ?? '0')
    const phaseColors = [
      'cfd3d7',
      'bfd4f2',
      'b7e4c7',
      'ffd6a5',
      'f1c0e8',
      'cdb4db',
      'fec89a',
      'bee1e6',
    ]
    return {
      color: phaseColors[phase] ?? 'cfd3d7',
      description: `Backlog phase ${phase}`,
    }
  }
  if (name.startsWith('area:')) {
    const area = name.split(':')[1]
    const colors = {
      tooling: '6c757d',
      data: '0b7285',
      network: '1d4ed8',
      state: '2f9e44',
      ui: '9c36b5',
      design: 'd6336c',
      perf: 'e67700',
      qa: '495057',
    }
    return {
      color: colors[area] ?? '6c757d',
      description: `Backlog area ${area}`,
    }
  }
  if (name.startsWith('size:')) {
    const size = name.split(':')[1]
    const colors = { xs: '2f9e44', s: '74c0fc', m: 'fab005' }
    return {
      color: colors[size] ?? '74c0fc',
      description: `Backlog size ${size}`,
    }
  }
  if (name.startsWith('difficulty:')) {
    const difficulty = name.split(':')[1]
    const colors = { beginner: '20c997', intermediate: 'fd7e14' }
    return {
      color: colors[difficulty] ?? '20c997',
      description: `Contributor difficulty ${difficulty}`,
    }
  }
  return { color: 'cfd3d7', description: name }
}

function gh(args) {
  return execFileSync('gh', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function ensureLabels() {
  const labelNames = new Set(issues.flatMap((issue) => getLabels(issue)))
  for (const name of labelNames) {
    const { color, description } = getLabelConfig(name)
    gh([
      'label',
      'create',
      name,
      '--color',
      color,
      '--description',
      description,
      '--force',
    ])
  }
}

function getExistingTitles() {
  const raw = gh([
    'issue',
    'list',
    '--state',
    'all',
    '--limit',
    '500',
    '--json',
    'title',
  ])
  const parsed = raw ? JSON.parse(raw) : []
  return new Set(parsed.map((issue) => issue.title))
}

function getLimit(argv) {
  const index = argv.indexOf('--limit')
  if (index === -1) {
    return undefined
  }
  const value = Number(argv[index + 1])
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function getStartAt(argv) {
  const index = argv.indexOf('--start-at')
  if (index === -1) {
    return undefined
  }
  return argv[index + 1]
}

function getSelectedIssues(argv) {
  const limit = getLimit(argv)
  const startAt = getStartAt(argv)
  let selected = issues

  if (startAt) {
    const offset = issues.findIndex((issue) => issue.id === startAt)
    if (offset === -1) {
      throw new Error(`Unknown issue id for --start-at: ${startAt}`)
    }
    selected = issues.slice(offset)
  }

  if (limit) {
    selected = selected.slice(0, limit)
  }

  return selected
}

function listIssues(argv) {
  const selected = getSelectedIssues(argv)
  for (const issue of selected) {
    const meta = [
      issue.id,
      issue.title,
      `phase:${issue.phase}`,
      `area:${issue.area}`,
      `size:${issue.size}`,
      `difficulty:${issue.difficulty}`,
      issue.dependencies.length
        ? `deps:${issue.dependencies.join(',')}`
        : 'deps:none',
    ]
    console.log(meta.join('\t'))
  }
  console.log(`\nListed ${selected.length} issues.`)
}

function publishIssues(argv) {
  const selected = getSelectedIssues(argv)
  ensureLabels()
  const existingTitles = getExistingTitles()

  let created = 0
  let skipped = 0

  for (const issue of selected) {
    if (existingTitles.has(issue.title)) {
      console.log(`skip\t${issue.id}\t${issue.title}`)
      skipped += 1
      continue
    }

    const args = [
      'issue',
      'create',
      '--title',
      issue.title,
      '--body',
      renderIssueBody(issue),
    ]
    for (const label of getLabels(issue)) {
      args.push('--label', label)
    }

    const output = gh(args)
    console.log(`create\t${issue.id}\t${output}`)
    existingTitles.add(issue.title)
    created += 1
  }

  console.log(
    `\nCreated ${created} issues, skipped ${skipped} existing titles.`,
  )
}

function main() {
  writeBacklogJson()

  const [, , command = 'list', ...rest] = process.argv
  if (command === 'build') {
    console.log(
      `Wrote ${issues.length} issues to ${path.relative(repoRoot, backlogJsonPath)}`,
    )
    return
  }
  if (command === 'list') {
    listIssues(rest)
    return
  }
  if (command === 'labels') {
    ensureLabels()
    console.log('Ensured labels.')
    return
  }
  if (command === 'publish') {
    publishIssues(rest)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main()
