import { MONACO_CDN, MONACO_MODULES } from './MonacoConfig.js'

export class MonacoModuleLoader {
  constructor() {
    this.requireConfig = {
      paths: {
        vs: MONACO_CDN.baseUrl
      }
    }
  }

  setupRequire() {
    if (!window.require) {
      window.require = this.requireConfig
    } else {
      window.require.paths = window.require.paths || {}
      window.require.paths.vs = MONACO_CDN.baseUrl
    }
  }

  async loadMainModule() {
    return new Promise((resolve, reject) => {
      try {
        this.setupRequire()

        window.require([MONACO_MODULES.main], () => {
          if (!window.monaco) {
            throw new Error('Monaco editor main module loaded but window.monaco not available')
          }
          resolve(window.monaco)
        })
      } catch (err) {
        const error = handleMonacoError(err, 'loadMainModule')
        reject(error)
      }
    })
  }

  async loadModule(modulePath) {
    return new Promise((resolve, reject) => {
      try {
        this.setupRequire()

        window.require([modulePath], (module) => {
          resolve(module)
        })
      } catch (err) {
        const error = handleMonacoError(err, `loadModule:${modulePath}`)
        reject(error)
      }
    })
  }
}
