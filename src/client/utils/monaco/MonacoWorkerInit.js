import { MONACO_CDN } from './MonacoConfig.js'

export class MonacoWorkerInit {
  constructor() {
    this.scriptLoaded = false
    this.scriptLoadPromise = null
  }

  loadScript() {
    if (this.scriptLoaded) {
      return Promise.resolve()
    }

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise
    }

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script')
        script.src = MONACO_CDN.loader
        script.type = 'text/javascript'
        script.async = true

        script.onload = () => {
          this.scriptLoaded = true
          resolve()
        }

        script.onerror = () => {
          const error = handleMonacoError(
            new Error(`Failed to load Monaco script from ${MONACO_CDN.loader}`),
            'scriptLoad'
          )
          reject(error)
        }

        script.onabort = () => {
          const error = handleMonacoError(
            new Error('Monaco script loading was aborted'),
            'scriptAbort'
          )
          reject(error)
        }

        document.head.appendChild(script)
      } catch (err) {
        const error = handleMonacoError(err, 'scriptCreation')
        reject(error)
      }
    })

    return this.scriptLoadPromise
  }

  async initialize() {
    await this.loadScript()
  }

  isInitialized() {
    return this.scriptLoaded && typeof window.require !== 'undefined'
  }

  reset() {
    this.scriptLoaded = false
    this.scriptLoadPromise = null
  }
}
