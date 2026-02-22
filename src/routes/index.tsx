import SearchLandingScreen from '@/components/Home/SearchLandingScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center h-full">
      <SearchLandingScreen />
    </div>
  )
}
