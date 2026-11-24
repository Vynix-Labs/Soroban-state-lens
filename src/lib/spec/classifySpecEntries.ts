import type { Spec } from '@stellar/stellar-sdk/contract'

type SpecEntry = Spec['entries'][number]
type EntryKind = ReturnType<SpecEntry['switch']>['name']
export const MAX_SPEC_DIAGNOSTICS = 32

export interface SpecEntryDiagnostics {
  supported: Array<SpecEntry>
  unsupported: Array<{ index: number; kind: EntryKind }>
  omittedDiagnostics: number
}

/** Preserve supported entries and report unsupported SDK-known variants. */
export function classifySpecEntries(
  entries: Array<SpecEntry>,
): SpecEntryDiagnostics {
  const supported: Array<SpecEntry> = []
  const unsupported: SpecEntryDiagnostics['unsupported'] = []
  let omittedDiagnostics = 0
  entries.forEach((entry, index) => {
    const kind = entry.switch().name
    if (
      kind === 'scSpecEntryFunctionV0' ||
      kind === 'scSpecEntryUdtStructV0' ||
      kind === 'scSpecEntryUdtEnumV0' ||
      kind === 'scSpecEntryUdtUnionV0'
    ) {
      supported.push(entry)
    } else if (unsupported.length < MAX_SPEC_DIAGNOSTICS) {
      unsupported.push({ index, kind })
    } else {
      omittedDiagnostics++
    }
  })
  return { supported, unsupported, omittedDiagnostics }
}
