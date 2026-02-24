import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import SearchLandingScreen from '@/components/Home/SearchLandingScreen'
import { createDecoderWorker } from '@/workers/createDecoderWorker'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  useEffect(() => {
    const worker = createDecoderWorker()
    worker.ping().then((res) => console.log('Worker integrated:', res))
  }, [])

  return (
    <div className="text-center h-full">
      <SearchLandingScreen />
    </div>
  )
}
