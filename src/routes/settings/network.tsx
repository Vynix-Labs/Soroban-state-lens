import { createFileRoute } from '@tanstack/react-router'
import { useNetworkConfig, useLensStore } from '../../store/lensStore'
import { ConnectionStatus } from '../../store/types'
import { DEFAULT_NETWORKS } from '../../store/lensStore'

export const Route = createFileRoute('/settings/network')({
  component: SettingsNetwork,
})

function SettingsNetwork() {
  const networkConfig = useNetworkConfig()
  const connectionStatus = useLensStore((state) => state.connectionStatus)
  const lastCustomUrl = useLensStore((state) => state.lastCustomUrl)

  const isCustomNetwork = !Object.values(DEFAULT_NETWORKS).some(
    (network) => network.rpcUrl === networkConfig.rpcUrl
  )

  const getConnectionStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.SUCCESS:
        return 'text-green-500'
      case ConnectionStatus.ERROR:
        return 'text-red-500'
      case ConnectionStatus.LOADING:
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getConnectionStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.SUCCESS:
        return 'Connected'
      case ConnectionStatus.ERROR:
        return 'Connection Failed'
      case ConnectionStatus.LOADING:
        return 'Connecting...'
      default:
        return 'Not Connected'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Network Settings</h1>
        <p className="text-gray-400">
          View and manage your network configuration settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Network Configuration */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Current Network Configuration
          </h2>
          
          <div className="space-y-4">
            {/* Network Type */}
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-300">Network Type</span>
              <span className="text-white font-medium">
                {isCustomNetwork ? 'Custom RPC' : 'Preset Network'}
              </span>
            </div>

            {/* Network ID */}
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-300">Network ID</span>
              <span className="text-white font-medium">{networkConfig.networkId}</span>
            </div>

            {/* RPC URL */}
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-300">RPC URL</span>
              <span className="text-white font-mono text-sm">{networkConfig.rpcUrl}</span>
            </div>

            {/* Horizon URL (if available) */}
            {networkConfig.horizonUrl && (
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-300">Horizon URL</span>
                <span className="text-white font-mono text-sm">{networkConfig.horizonUrl}</span>
              </div>
            )}

            {/* Network Passphrase */}
            <div className="flex justify-between items-start py-3 border-b border-gray-700">
              <span className="text-gray-300">Network Passphrase</span>
              <span className="text-white font-mono text-sm text-right max-w-md break-all">
                {networkConfig.networkPassphrase}
              </span>
            </div>

            {/* Connection Status */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-300">Connection Status</span>
              <span className={`font-medium ${getConnectionStatusColor(connectionStatus)}`}>
                {getConnectionStatusText(connectionStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Last Custom URL (if available) */}
        {lastCustomUrl && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Last Custom RPC URL
            </h2>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-300">URL</span>
              <span className="text-white font-mono text-sm">{lastCustomUrl}</span>
            </div>
          </div>
        )}

        {/* Available Preset Networks */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Available Preset Networks
          </h2>
          <div className="space-y-3">
            {Object.entries(DEFAULT_NETWORKS).map(([key, network]) => (
              <div
                key={key}
                className={`p-3 rounded border ${
                  network.rpcUrl === networkConfig.rpcUrl
                    ? 'bg-blue-900 border-blue-500'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium capitalize">
                      {key}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {network.rpcUrl}
                    </div>
                  </div>
                  {network.rpcUrl === networkConfig.rpcUrl && (
                    <span className="text-blue-400 text-sm font-medium">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
