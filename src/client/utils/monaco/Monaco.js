import { MonacoWorkerInit } from './MonacoWorkerInit.js'
import { MonacoModuleLoader } from './MonacoModuleLoader.js'
import { defineTheme } from './MonacoTheme.js'

export class Monaco {
  constructor() {
    this.workerInit = new MonacoWorkerInit()
    this.moduleLoader = new MonacoModuleLoader()
    this.loadPromise = null
    this.loaded = false
  }

  async load() {
    if (this.loaded) {
      return window.monaco
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this.initialize()
    return this.loadPromise
  }

  async initialize() {
    try {
      await this.workerInit.initialize()

      const monaco = await this.moduleLoader.loadMainModule()

      defineTheme(monaco)

      this.loaded = true
      return monaco
    } catch (err) {
      const error = handleMonacoError(err, 'initialize')
      this.loadPromise = null
      throw error
    }
  }

  get() {
    return validateMonacoLoaded()
  }

  isLoaded() {
    return this.loaded
  }

  reset() {
    this.loaded = false
    this.loadPromise = null
    this.workerInit.reset()
  }
}

let monacoInstance = null

export function getMonaco() {
  if (!monacoInstance) {
    monacoInstance = new Monaco()
  }
  return monacoInstance
}

export async function loadMonaco() {
  const monaco = getMonaco()
  return monaco.load()
}
