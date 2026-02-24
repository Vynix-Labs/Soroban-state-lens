#!/usr/bin/env node

function compareVersions(version, required) {
  // Parse versions into components (e.g., "20.1.0" -> [20, 1, 0])
  const parsedVersion = version.split('.').map(Number)
  const match = required.match(/^>=(\d+)\.(\d+)\.(\d+)/)

  if (!match) return false

  const [, major, minor, patch] = match.map(Number)

  if (parsedVersion[0] > major) return true
  if (parsedVersion[0] < major) return false
  if (parsedVersion[1] > minor) return true
  if (parsedVersion[1] < minor) return false
  if (parsedVersion[2] >= patch) return true

  return false
}

const NODE_VERSION_REQUIRED = '>=20.0.0'
const BUN_VERSION_REQUIRED = '>=1.0.0'

let hasErrors = false

// Check Node.js version
const nodeVersion = process.version.slice(1) // Remove 'v' prefix
if (!compareVersions(nodeVersion, NODE_VERSION_REQUIRED)) {
  console.error(
    ` Node.js version mismatch\n` +
      `   Required: ${NODE_VERSION_REQUIRED}\n` +
      `   Found: v${nodeVersion}\n` +
      `   Fix: Use nvm to install Node.js v20 or later\n` +
      `        nvm install 20\n` +
      `        nvm use 20`,
  )
  hasErrors = true
} else {
  console.log(`✓ Node.js v${nodeVersion} (required: ${NODE_VERSION_REQUIRED})`)
}

// Check Bun version (if running under Bun)
const isBun = typeof Bun !== 'undefined'
if (isBun) {
  const bunVersion = Bun.version
  if (!compareVersions(bunVersion, BUN_VERSION_REQUIRED)) {
    console.error(
      ` Bun version mismatch\n` +
        `   Required: ${BUN_VERSION_REQUIRED}\n` +
        `   Found: ${bunVersion}\n` +
        `   Fix: Update Bun to v1.0.0 or later\n` +
        `        npm install -g bun@latest`,
    )
    hasErrors = true
  } else {
    console.log(`✓ Bun ${bunVersion} (required: ${BUN_VERSION_REQUIRED})`)
  }
}

// Exit with error code if versions don't match
if (hasErrors) {
  console.error(
    `\n  Environment check failed. Please resolve the version mismatches above.`,
  )
  process.exit(1)
}

console.log(`\n✓ All environment checks passed!`)
process.exit(0)
