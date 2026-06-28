export interface SpecEnumCase {
  name: string
  value: number
}

export interface SpecEnumEntry {
  name: string
  cases: Array<SpecEnumCase>
}

export type EnumLookup = Record<string, Record<number, string>>

export function buildEnumLookup(entries: Array<SpecEnumEntry>): EnumLookup {
  const lookup: EnumLookup = {}
  for (const entry of entries) {
    const cases: Record<number, string> = {}
    for (const c of entry.cases) {
      cases[c.value] = c.name
    }
    lookup[entry.name] = cases
  }
  return lookup
}

export function resolveEnumValue(
  lookup: EnumLookup,
  value: number,
): { typeName: string; label: string } | undefined {
  for (const [typeName, cases] of Object.entries(lookup)) {
    if (value in cases) {
      return { typeName, label: cases[value] }
    }
  }
  return undefined
}
