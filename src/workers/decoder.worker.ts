import * as Comlink from 'comlink'

// Define the worker API interface
export interface DecoderWorkerAPI {
  ping: () => Promise<string>
}

// Implementation of the worker API
const decoderWorkerAPI: DecoderWorkerAPI = {
  ping(): Promise<string> {
    return Promise.resolve('pong')
  },
}

// Expose the API through Comlink
Comlink.expose(decoderWorkerAPI)
