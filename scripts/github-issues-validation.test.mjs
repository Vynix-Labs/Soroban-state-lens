import { describe, it, expect } from 'vitest'

// Mock the issues data for testing
const mockIssues = [
  {
    id: 'SSL-D01',
    title: 'Test Issue 1',
    phase: 0,
    area: 'qa',
    size: 's',
    difficulty: 'intermediate',
    goodFirst: false,
    dependencies: [],
    problem: 'Test problem',
    context: 'Test context',
    scopeIn: ['Test scope in'],
    scopeOut: ['Test scope out'],
    checklist: ['Test checklist'],
    acceptance: ['Test acceptance'],
    verification: ['Test verification'],
  },
  {
    id: 'SSL-D02',
    title: 'Test Issue 2',
    phase: 1,
    area: 'state',
    size: 'xs',
    difficulty: 'beginner',
    goodFirst: true,
    dependencies: [],
    problem: 'Test problem',
    context: 'Test context',
    scopeIn: ['Test scope in'],
    scopeOut: ['Test scope out'],
    checklist: ['Test checklist'],
    acceptance: ['Test acceptance'],
    verification: ['Test verification'],
  },
]

function validateIssueUniqueness(issues) {
  const ids = new Map()
  const titles = new Map()
  const duplicateIds = []
  const duplicateTitles = []

  for (const issue of issues) {
    if (ids.has(issue.id)) {
      duplicateIds.push(issue.id)
    } else {
      ids.set(issue.id, issue.title)
    }

    if (titles.has(issue.title)) {
      duplicateTitles.push(issue.title)
    } else {
      titles.set(issue.title, issue.id)
    }
  }

  if (duplicateIds.length > 0 || duplicateTitles.length > 0) {
    const errors = []
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate issue IDs: ${[...new Set(duplicateIds)].join(', ')}`)
    }
    if (duplicateTitles.length > 0) {
      errors.push(`Duplicate issue titles: ${[...new Set(duplicateTitles)].join(', ')}`)
    }
    throw new Error(`Issue data validation failed:\n${errors.join('\n')}`)
  }
}

describe('validateIssueUniqueness', () => {
  it('should pass when all IDs and titles are unique', () => {
    expect(() => validateIssueUniqueness(mockIssues)).not.toThrow()
  })

  it('should fail when duplicate IDs exist', () => {
    const issuesWithDuplicateIds = [
      ...mockIssues,
      {
        id: 'SSL-D01',
        title: 'Test Issue 3',
        phase: 1,
        area: 'state',
        size: 'xs',
        difficulty: 'beginner',
        goodFirst: true,
        dependencies: [],
        problem: 'Test problem',
        context: 'Test context',
        scopeIn: ['Test scope in'],
        scopeOut: ['Test scope out'],
        checklist: ['Test checklist'],
        acceptance: ['Test acceptance'],
        verification: ['Test verification'],
      },
    ]

    expect(() => validateIssueUniqueness(issuesWithDuplicateIds)).toThrow(
      'Duplicate issue IDs: SSL-D01',
    )
  })

  it('should fail when duplicate titles exist', () => {
    const issuesWithDuplicateTitles = [
      ...mockIssues,
      {
        id: 'SSL-D03',
        title: 'Test Issue 1',
        phase: 1,
        area: 'state',
        size: 'xs',
        difficulty: 'beginner',
        goodFirst: true,
        dependencies: [],
        problem: 'Test problem',
        context: 'Test context',
        scopeIn: ['Test scope in'],
        scopeOut: ['Test scope out'],
        checklist: ['Test checklist'],
        acceptance: ['Test acceptance'],
        verification: ['Test verification'],
      },
    ]

    expect(() => validateIssueUniqueness(issuesWithDuplicateTitles)).toThrow(
      'Duplicate issue titles: Test Issue 1',
    )
  })

  it('should fail when both duplicate IDs and titles exist', () => {
    const issuesWithBothDuplicates = [
      ...mockIssues,
      {
        id: 'SSL-D01',
        title: 'Test Issue 3',
        phase: 1,
        area: 'state',
        size: 'xs',
        difficulty: 'beginner',
        goodFirst: true,
        dependencies: [],
        problem: 'Test problem',
        context: 'Test context',
        scopeIn: ['Test scope in'],
        scopeOut: ['Test scope out'],
        checklist: ['Test checklist'],
        acceptance: ['Test acceptance'],
        verification: ['Test verification'],
      },
      {
        id: 'SSL-D04',
        title: 'Test Issue 1',
        phase: 1,
        area: 'state',
        size: 'xs',
        difficulty: 'beginner',
        goodFirst: true,
        dependencies: [],
        problem: 'Test problem',
        context: 'Test context',
        scopeIn: ['Test scope in'],
        scopeOut: ['Test scope out'],
        checklist: ['Test checklist'],
        acceptance: ['Test acceptance'],
        verification: ['Test verification'],
      },
    ]

    expect(() => validateIssueUniqueness(issuesWithBothDuplicates)).toThrow(
      'Issue data validation failed',
    )
  })

  it('should handle empty array', () => {
    expect(() => validateIssueUniqueness([])).not.toThrow()
  })

  it('should handle single issue', () => {
    expect(() => validateIssueUniqueness([mockIssues[0]])).not.toThrow()
  })
})
