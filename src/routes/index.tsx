import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import SearchLandingScreen from '@/components/Home/SearchLandingScreen'
import { probeDecoderWorker } from './initializeDecoderWorkerPing'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  useEffect(() => {
    void probeDecoderWorker()
  }, [])

  return (
    <div className="text-center h-full">
      <SearchLandingScreen />
    </div>
  )
}
