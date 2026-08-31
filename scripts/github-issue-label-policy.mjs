export const PUBLISHER_LABEL = 'good first issue'

export function getPublisherLabels(issue) {
  return issue.goodFirst ? [PUBLISHER_LABEL] : []
}

export function validatePublisherLabelPolicy(selectedIssues) {
  const invalidIssues = selectedIssues.filter((issue) => {
    const labels = getPublisherLabels(issue)
    return labels.length !== 1 || labels[0] !== PUBLISHER_LABEL
  })

  if (invalidIssues.length > 0) {
    const issueIds = invalidIssues.map((issue) => issue.id).join(', ')
    throw new Error(
      'Selected wave issues must have exactly one publisher label (' +
        PUBLISHER_LABEL +
        '). Invalid: ' +
        issueIds,
    )
  }
}
