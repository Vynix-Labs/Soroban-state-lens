import { useEffect, useState } from 'react'
import { formatArgumentPreview } from '../../lib/network/formatArgumentPreview'
import { isDecoderWorkerError } from '../../types/decoder-worker'
import { RecoveringDecoder } from '../../workers/recoveringDecoder'

export const MAX_ARGUMENT_PREVIEWS = 16
export const MAX_ARGUMENT_XDR_CHARACTERS = 65536

interface ArgumentPreview {
  type: string
  text: string
}

export function InvocationArguments({
  argumentXdr,
}: {
  argumentXdr: ReadonlyArray<string>
}) {
  const [result, setResult] = useState<{
    source: ReadonlyArray<string>
    previews: Array<ArgumentPreview>
  } | null>(null)
  useEffect(() => {
    if (argumentXdr.length === 0) return
    const decoder = new RecoveringDecoder()
    const controller = new AbortController()
    void (async () => {
      const previews: Array<ArgumentPreview> = []
      try {
        for (const encoded of argumentXdr.slice(0, MAX_ARGUMENT_PREVIEWS)) {
          if (controller.signal.aborted) return
          if (encoded.length > MAX_ARGUMENT_XDR_CHARACTERS) {
            previews.push({
              type: 'omitted',
              text: 'Argument exceeds the 64 KiB encoded XDR preview limit.',
            })
            continue
          }
          const node = await decoder.decodeScVal(encoded, { maxDepth: 4 })
          if (isDecoderWorkerError(node))
            previews.push({
              type: 'unavailable',
              text: `Unable to decode argument (${node.code}).`,
            })
          else
            previews.push({
              type: node.kind === 'primitive' ? node.scType : node.kind,
              text: formatArgumentPreview(node),
            })
        }
        if (!controller.signal.aborted)
          setResult({ source: argumentXdr, previews })
      } finally {
        decoder.terminate()
      }
    })()
    return () => {
      controller.abort()
      decoder.terminate()
    }
  }, [argumentXdr])
  const previews = result?.source === argumentXdr ? result.previews : null
  return (
    <section
      aria-label="Arguments from transaction XDR"
      className="space-y-2 text-xs text-text-muted"
    >
      <h3 className="font-semibold text-white">
        Arguments from transaction XDR
      </h3>
      {argumentXdr.length === 0 ? (
        <p>This invocation has no arguments.</p>
      ) : previews === null ? (
        <p role="status">Decoding transaction arguments…</p>
      ) : (
        <ol className="space-y-2">
          {previews.map((preview, index) => (
            <li key={index} className="rounded border border-border-dark p-2">
              <p>
                Argument {index + 1}:{' '}
                <span className="font-mono">{preview.type}</span>
              </p>
              <pre className="whitespace-pre-wrap break-all">
                {preview.text}
              </pre>
            </li>
          ))}
        </ol>
      )}
      {argumentXdr.length > MAX_ARGUMENT_PREVIEWS ? (
        <p>
          Showing the first {MAX_ARGUMENT_PREVIEWS} of {argumentXdr.length}{' '}
          arguments.
        </p>
      ) : null}
    </section>
  )
}
