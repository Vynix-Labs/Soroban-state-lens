export function buildParityReport(sourceIssues, liveIssues) {
  const sourceByTitle = new Map(
    sourceIssues.map((issue) => [issue.title, issue]),
  )
  const liveByTitle = new Map()

  for (const issue of liveIssues) {
    const matching = liveByTitle.get(issue.title) ?? []
    matching.push(issue)
    liveByTitle.set(issue.title, matching)
  }

  const missing = sourceIssues
    .filter((issue) => !liveByTitle.has(issue.title))
    .map(({ id, title }) => ({ id, title }))
  const duplicates = [...liveByTitle.entries()]
    .filter(([, matching]) => matching.length > 1)
    .map(([title, matching]) => ({
      title,
      numbers: matching
        .map((issue) => issue.number)
        .sort((left, right) => left - right),
    }))
  const bodyMismatches = sourceIssues
    .filter((issue) => {
      const matching = liveByTitle.get(issue.title)
      return matching?.length === 1 && matching[0].body !== issue.body
    })
    .map(({ id, title }) => ({ id, title }))

  return {
    missing,
    duplicates,
    bodyMismatches,
    sourceCount: sourceByTitle.size,
  }
}
