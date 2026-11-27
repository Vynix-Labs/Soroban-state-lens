import { useState } from 'react'
import { resolveEnumValue } from '../../lib/spec/resolveEnumValue'
import { resolveNodeAtPath } from '../../lib/tree/resolveNodeAtPath'
import { contractSpecKey } from '../../store/contractSpecSlice'
import { useLensStore } from '../../store/lensStore'
import type { LedgerEntry } from '../../store/types'
import type { ContractSpec } from '../../types/contract-spec'
import type { Node } from '../../types/node'

interface InspectorEnumProps {
  contractId: string
  keyPath: string
  entry: LedgerEntry
}

function decodedNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof value.kind === 'string'
  )
}

/** Resolve only the enum explicitly chosen for this value and metadata context. */
export function InspectorEnum({
  contractId,
  keyPath,
  entry,
}: InspectorEnumProps) {
  const spec = useLensStore((state) => state.getContractSpec(contractId))
  const scope = useLensStore((state) =>
    contractSpecKey(state.networkConfig, contractId),
  )
  const [choice, setChoice] = useState<{
    scope: string | null
    keyPath: string
    spec: ContractSpec
    name: string
  } | null>(null)
  const node = decodedNode(entry.value)
    ? resolveNodeAtPath(entry.value, entry.key, keyPath)
    : undefined
  if (
    node?.kind !== 'primitive' ||
    node.scType !== 'u32' ||
    typeof node.value !== 'number' ||
    !Number.isInteger(node.value) ||
    node.value < 0 ||
    node.value > 0xffffffff
  )
    return null
  const enums = spec?.entries.filter((item) => item.kind === 'enum') ?? []
  const selected =
    choice?.scope === scope &&
    choice.keyPath === keyPath &&
    choice.spec === spec
      ? enums.find((item) => item.name === choice.name)
      : undefined
  const lookup = selected
    ? Object.fromEntries([
        [
          selected.name,
          Object.fromEntries(
            selected.cases.map((item) => {
              const name = item.name()
              return [
                item.value(),
                typeof name === 'string'
                  ? name
                  : new TextDecoder().decode(name),
              ]
            }),
          ),
        ],
      ])
    : {}
  const resolved = selected ? resolveEnumValue(lookup, node.value) : undefined
  return (
    <section
      aria-label="Enum interpretation"
      className="rounded border border-border-dark p-6 space-y-3"
    >
      <h3 className="text-white">Enum interpretation</h3>
      <p>
        Numeric value: <code>{node.value}</code>
      </p>
      {enums.length > 0 ? (
        <>
          <label htmlFor="inspector-enum-choice">
            Choose an enum for this value
          </label>
          <select
            id="inspector-enum-choice"
            value={selected?.name ?? ''}
            onChange={(event) => {
              if (spec)
                setChoice({
                  scope,
                  keyPath,
                  spec,
                  name: event.currentTarget.value,
                })
            }}
          >
            <option value="">No interpretation selected</option>
            {enums.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          {selected ? (
            <p role="status">
              {resolved
                ? `${resolved.typeName}.${resolved.label}`
                : `Unknown ${selected.name} case (${node.value}). Numeric value preserved.`}
            </p>
          ) : null}
        </>
      ) : (
        <p>
          Load a contract spec containing an enum to choose an interpretation.
        </p>
      )}
    </section>
  )
}
