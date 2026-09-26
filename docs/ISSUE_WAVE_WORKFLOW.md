# Contributor issue-wave workflow

The issue catalog lives in scripts/github-issues-data.mjs. Each entry has a
stable id, title, phase, area, size, difficulty, dependency list, scope,
acceptance criteria, and verification steps. Keep those fields aligned with
the generated issue body.

Publisher labels are deterministic. Every issue gets enhancement and help
wanted, plus phase, area, size, and difficulty labels. A catalog entry with
goodFirst: true also gets exactly one good first issue publisher label.

The publisher skips an issue when an existing issue has the same title. This
prevents rerunning a wave from creating duplicate titles. It does not replace
source-to-live parity checks; compare generated bodies after publishing.

Build and inspect the catalog:

```bash
bun run issues:build
bun run issues:list -- --limit 10
```

Ensure labels and publish selected entries:

```bash
bun run issues:labels
bun run issues:publish -- --start-at SSL-D02 --limit 3
```

Before opening a pull request, run the focused tests and formatter. Verify
that the issue title, labels, body, and assigned account match the selected
catalog entry. Do not include credentials or real account secrets in issue
examples.
