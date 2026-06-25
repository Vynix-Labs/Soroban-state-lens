import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Heading } from '@stellar/design-system'
import { useLensStore } from '../../store/lensStore'
import { BigIntDisplayMode, ByteDisplayMode } from '../../store/types'

export const Route = createFileRoute('/settings/preferences')({
  component: PreferencesSettings,
})

function PreferencesSettings() {
  const byteDisplayMode = useLensStore((state) => state.byteDisplayMode)
  const bigIntDisplayMode = useLensStore((state) => state.bigIntDisplayMode)
  const setByteDisplayMode = useLensStore((state) => state.setByteDisplayMode)
  const setBigIntDisplayMode = useLensStore(
    (state) => state.setBigIntDisplayMode,
  )
  const resetPreferences = useLensStore((state) => state.resetPreferences)

  return (
    <div className="p-8">
      <Heading size="xl" as="h1">
        Preferences
      </Heading>

      <div className="mt-8 grid gap-4 max-w-md">
        <Card>
          <div className="p-4 flex flex-col gap-6">
            <div>
              <Heading size="sm" as="h3" className="mb-2">
                Byte Display Mode
              </Heading>
              <select
                value={byteDisplayMode}
                onChange={(e) =>
                  setByteDisplayMode(e.target.value as ByteDisplayMode)
                }
                className="w-full p-2 border rounded"
              >
                <option value={ByteDisplayMode.HEX}>Hex</option>
                <option value={ByteDisplayMode.BASE64}>Base64</option>
              </select>
            </div>

            <div>
              <Heading size="sm" as="h3" className="mb-2">
                BigInt Display Mode
              </Heading>
              <select
                value={bigIntDisplayMode}
                onChange={(e) =>
                  setBigIntDisplayMode(e.target.value as BigIntDisplayMode)
                }
                className="w-full p-2 border rounded"
              >
                <option value={BigIntDisplayMode.RAW}>Raw</option>
                <option value={BigIntDisplayMode.FORMATTED}>Formatted</option>
              </select>
            </div>

            <div className="mt-2 pt-4 border-t">
              <Button variant="secondary" size="md" onClick={resetPreferences}>
                Reset Preferences
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
