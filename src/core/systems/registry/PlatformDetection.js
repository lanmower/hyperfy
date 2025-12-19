const isServer = typeof process !== 'undefined' && typeof window === 'undefined'
const isClient = typeof window !== 'undefined'

export class PlatformDetection {
  static getCurrentPlatform() {
    if (isServer) return 'server'
    if (isClient) return 'client'
    return 'unknown'
  }

  static isServer() {
    return isServer
  }

  static isClient() {
    return isClient
  }
}
