import { HyperfyError } from '../../systems/error/ErrorCodes.js'

export class ScriptExecutor {
  constructor(app) {
    this.app = app
    this.script = null
    this.context = null
    this.listeners = {
      fixedUpdate: null,
      update: null,
      lateUpdate: null,
    }
    this.executionErrors = []
    this.maxErrors = 50
  }

  recordError(error, phase = 'execution') {
    const errorRecord = {
      timestamp: Date.now(),
      phase,
      message: error.message,
      code: error.code,
      stack: error.stack,
      appId: this.app?.data?.id,
    }
    this.executionErrors.push(errorRecord)
    if (this.executionErrors.length > this.maxErrors) {
      this.executionErrors.shift()
    }
    return errorRecord
  }

  executeScript(scriptCode, blueprint, props, setTimeoutFn, getWorldProxy, getAppProxy, fetchFn) {
    if (!scriptCode) {
      return true
    }

    try {
      if (!this.app) {
        throw new HyperfyError('NULL_REFERENCE', 'Script executor app reference is null', { phase: 'executeScript' })
      }

      const world = this.app.world
      if (!world) {
        throw new HyperfyError('INVALID_STATE', 'World not available in script executor', { phase: 'executeScript' })
      }

      const scripts = world.scripts
      if (!scripts) {
        throw new HyperfyError('INVALID_STATE', 'Scripts system not available', { phase: 'executeScript' })
      }

      let evaluated
      try {
        if (typeof scriptCode === 'string') {
          if (scriptCode.trim().length === 0) {
            console.warn('[ScriptExecutor] Empty script code provided')
            return true
          }
          evaluated = scripts.evaluate(scriptCode)
        } else if (scriptCode.exec && scriptCode.code) {
          evaluated = scriptCode
        } else {
          throw new HyperfyError('TYPE_MISMATCH', `Invalid script format: ${typeof scriptCode}`, { phase: 'parseScript' })
        }
      } catch (parseErr) {
        const hyperfyError = parseErr instanceof HyperfyError ? parseErr : new HyperfyError('SCRIPT_ERROR', `Script parsing failed: ${parseErr.message}`, { originalError: parseErr.toString() })
        this.recordError(hyperfyError, 'parse')
        console.error('[ScriptExecutor] Script parsing failed:', hyperfyError)
        return false
      }

      if (!evaluated) {
        console.warn('[ScriptExecutor] Script evaluation returned null')
        return true
      }

      if (!evaluated.exec || typeof evaluated.exec !== 'function') {
        throw new HyperfyError('INVALID_STATE', 'Evaluated script has no exec function', { phase: 'executeScript' })
      }

      let appContext
      try {
        const worldProxy = getWorldProxy()
        const appProxy = getAppProxy()

        if (!worldProxy) {
          throw new HyperfyError('NULL_REFERENCE', 'World proxy not available', { phase: 'executeScript' })
        }
        if (!appProxy) {
          throw new HyperfyError('NULL_REFERENCE', 'App proxy not available', { phase: 'executeScript' })
        }

        appContext = evaluated.exec(worldProxy, appProxy, fetchFn, props || {}, setTimeoutFn)
      } catch (execErr) {
        const hyperfyError = execErr instanceof HyperfyError ? execErr : new HyperfyError('SCRIPT_ERROR', `Script execution failed: ${execErr.message}`, { originalError: execErr.toString() })
        this.recordError(hyperfyError, 'execution')
        console.error('[ScriptExecutor] Script execution failed:', hyperfyError)
        return false
      }

      if (!appContext) {
        return true
      }

      try {
        this.context = appContext
        this.script = scriptCode

        if (appContext.fixedUpdate && typeof appContext.fixedUpdate === 'function') {
          this.listeners.fixedUpdate = appContext.fixedUpdate
          this.app.on('fixedUpdate', this.listeners.fixedUpdate)
        }

        if (appContext.update && typeof appContext.update === 'function') {
          this.listeners.update = appContext.update
          this.app.on('update', this.listeners.update)
        }

        if (appContext.lateUpdate && typeof appContext.lateUpdate === 'function') {
          this.listeners.lateUpdate = appContext.lateUpdate
          this.app.on('lateUpdate', this.listeners.lateUpdate)
        }

        if (appContext.onLoad && typeof appContext.onLoad === 'function') {
          try {
            appContext.onLoad()
          } catch (onLoadErr) {
            const hyperfyError = onLoadErr instanceof HyperfyError ? onLoadErr : new HyperfyError('SCRIPT_ERROR', `onLoad failed: ${onLoadErr.message}`, { originalError: onLoadErr.toString() })
            this.recordError(hyperfyError, 'onLoad')
            console.error('[ScriptExecutor] onLoad failed, stopping execution:', hyperfyError)
            return false
          }
        }
      } catch (hookErr) {
        const hyperfyError = hookErr instanceof HyperfyError ? hookErr : new HyperfyError('SCRIPT_ERROR', `Failed to register script hooks: ${hookErr.message}`, { originalError: hookErr.toString() })
        this.recordError(hyperfyError, 'hookRegistration')
        console.error('[ScriptExecutor] Hook registration failed:', hyperfyError)
        return false
      }

      return true
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `Unexpected error in script executor: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'executor')
      console.error('[ScriptExecutor] Unexpected error:', hyperfyError)
      return false
    }
  }

  fixedUpdate(delta) {
    if (!this.listeners.fixedUpdate) return

    try {
      this.listeners.fixedUpdate(delta)
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `fixedUpdate error: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'fixedUpdate')
      console.error('[ScriptExecutor] fixedUpdate error:', hyperfyError)
    }
  }

  update(delta) {
    if (!this.listeners.update) return

    try {
      this.listeners.update(delta)
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `update error: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'update')
      console.error('[ScriptExecutor] update error:', hyperfyError)
    }
  }

  lateUpdate(delta) {
    if (!this.listeners.lateUpdate) return

    try {
      this.listeners.lateUpdate(delta)
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `lateUpdate error: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'lateUpdate')
      console.error('[ScriptExecutor] lateUpdate error:', hyperfyError)
    }
  }

  cleanup() {
    try {
      if (this.context?.onUnload && typeof this.context.onUnload === 'function') {
        try {
          this.context.onUnload()
        } catch (err) {
          const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `onUnload failed: ${err.message}`, { originalError: err.toString() })
          this.recordError(hyperfyError, 'onUnload')
          console.error('[ScriptExecutor] onUnload failed:', hyperfyError)
        }
      }

      if (this.listeners.fixedUpdate && this.app) {
        this.app.off('fixedUpdate', this.listeners.fixedUpdate)
      }
      if (this.listeners.update && this.app) {
        this.app.off('update', this.listeners.update)
      }
      if (this.listeners.lateUpdate && this.app) {
        this.app.off('lateUpdate', this.listeners.lateUpdate)
      }
    } catch (cleanupErr) {
      const hyperfyError = cleanupErr instanceof HyperfyError ? cleanupErr : new HyperfyError('SCRIPT_ERROR', `Cleanup error: ${cleanupErr.message}`, { originalError: cleanupErr.toString() })
      this.recordError(hyperfyError, 'cleanup')
      console.error('[ScriptExecutor] Cleanup error:', hyperfyError)
    } finally {
      this.context = null
      this.script = null
      this.listeners = {
        fixedUpdate: null,
        update: null,
        lateUpdate: null,
      }
    }
  }

  getErrors(phase = null) {
    if (!phase) return this.executionErrors
    return this.executionErrors.filter(e => e.phase === phase)
  }

  getLastError() {
    return this.executionErrors[this.executionErrors.length - 1] || null
  }

  clearErrors() {
    this.executionErrors = []
  }
}
