/**
 * Encode decode request codec for worker message boundaries.
 * Validates and encodes request payload as JSON string for worker boundary transport.
 */

export interface EncodeDecodeRequestInput {
  xdr: string
  options?: {
    maxDepth?: number
  }
}

/**
 * Validates and encodes a decode request payload for worker transport.
 * 
 * @param input - The request input containing xdr and optional maxDepth
 * @returns JSON string representation of the validated request
 * @throws Error when xdr is empty or invalid
 */
export function encodeDecodeRequest(input: EncodeDecodeRequestInput): string {
  // Validate xdr is not empty
  if (!input.xdr || input.xdr.trim() === '') {
    throw new Error('xdr cannot be empty')
  }

  // Create the request object
  const request: EncodeDecodeRequestInput = {
    xdr: input.xdr,
  }

  // Handle options with maxDepth clamping
  if (input.options) {
    const options: { maxDepth?: number } = {}
    
    if (input.options.maxDepth !== undefined) {
      // Clamp maxDepth to reasonable bounds (1-1000)
      const clampedMaxDepth = Math.max(1, Math.min(1000, input.options.maxDepth))
      options.maxDepth = clampedMaxDepth
    }
    
    request.options = options
  }

  // Return JSON string representation
  return JSON.stringify(request)
}
