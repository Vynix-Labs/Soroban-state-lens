import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Heading } from '@stellar/design-system'

export const Route = createFileRoute('/sds-demo')({
  component: SdsDemo,
})

function SdsDemo() {
  return (
    <div className="p-8">
      <Heading size="xl" as="h1">
        Stellar Design System Demo
      </Heading>

      <div className="mt-8 grid gap-4">
        <Card>
          <div className="p-4">
            <Heading size="md" as="h3">
              Buttons
            </Heading>
            <div className="flex gap-4 mt-4">
              <Button variant="primary" size="md">
                Primary
              </Button>
              <Button variant="secondary" size="md">
                Secondary
              </Button>
              <Button variant="tertiary" size="md">
                Tertiary
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <Heading size="md" as="h3">
              Typography
            </Heading>
            <p>This should use the Inter font.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
