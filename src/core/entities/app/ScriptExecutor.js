import { StructuredLogger } from '../../utils/logging/index.js'
import { HyperfyError } from '../../utils/errors/HyperfyError.js'
import { ScriptExecutorValidator } from './ScriptExecutorValidator.js'
import { ScriptExecutorRuntime } from './ScriptExecutorRuntime.js'

const logger = new StructuredLogger('ScriptExecutor')

export class ScriptExecutor {
  constructor(app) {
    this.app = app
    this.script = null
    this.context = null
    this.listeners = { fixedUpdate: null, update: null, lateUpdate: null }
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
    if (!scriptCode) return true
    try {
      if (!this.app) throw new HyperfyError('NULL_REFERENCE', 'App reference is null', { phase: 'executeScript' })
      const scripts = this.app.world?.scripts
      if (!scripts) throw new HyperfyError('INVALID_STATE', 'Scripts system not available', { phase: 'executeScript' })

      const codeValidation = ScriptExecutorValidator.validateScriptCode(scriptCode, this.app, blueprint)
      if (!codeValidation.valid) {
        this.recordError(codeValidation.error, 'validation')
        logger.error('Script validation failed:', codeValidation.error)
        return false
      }
      if (!codeValidation.result) return true

      let evaluated
      try {
        evaluated = ScriptExecutorRuntime.parseScript(codeValidation.result, scripts)
      } catch (parseErr) {
        this.recordError(parseErr, 'parse')
        logger.error('Script parsing failed:', parseErr)
        return false
      }

      const evalValidation = ScriptExecutorValidator.validateExecutedScript(evaluated)
      if (!evalValidation.valid) {
        this.recordError(evalValidation.error, 'validation')
        logger.error('Script validation failed:', evalValidation.error)
        return false
      }
      if (!evalValidation.result) return true

      const worldProxy = getWorldProxy()
      const appProxy = getAppProxy()
      const proxyValidation = ScriptExecutorValidator.validateProxies(worldProxy, appProxy)
      if (!proxyValidation.valid) {
        this.recordError(proxyValidation.error, 'validation')
        logger.error('Proxy validation failed:', proxyValidation.error)
        return false
      }

      const propValidation = ScriptExecutorValidator.validateProperties(props, this.app, blueprint)
      if (!propValidation.valid) {
        this.recordError(propValidation.error, 'propertyValidation')
        logger.error('Property validation failed:', propValidation.error)
        return false
      }

      let appContext
      try {
        appContext = ScriptExecutorRuntime.executeScript(evalValidation.result, worldProxy, appProxy, fetchFn, propValidation.result, setTimeoutFn)
      } catch (execErr) {
        this.recordError(execErr, 'execution')
        logger.error('Script execution failed:', execErr)
        return false
      }
      if (!appContext) return true

      try {
        this.context = appContext
        this.script = scriptCode
        this.listeners = ScriptExecutorRuntime.registerHooks(this.app, appContext, this.recordError.bind(this))
      } catch (hookErr) {
        this.recordError(hookErr, 'hookRegistration')
        logger.error('Hook registration failed:', hookErr)
        return false
      }
      return true
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `Executor error: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'executor')
      logger.error('Unexpected error:', hyperfyError)
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
      logger.error('fixedUpdate error:', hyperfyError)
    }
  }

  update(delta) {
    if (!this.listeners.update) return
    try {
      this.listeners.update(delta)
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `update error: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'update')
      logger.error('update error:', hyperfyError)
    }
  }

  lateUpdate(delta) {
    if (!this.listeners.lateUpdate) return
    try {
      this.listeners.lateUpdate(delta)
    } catch (err) {
      const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `lateUpdate error: ${err.message}`, { originalError: err.toString() })
      this.recordError(hyperfyError, 'lateUpdate')
      logger.error('lateUpdate error:', hyperfyError)
    }
  }

  cleanup() {
    try {
      ScriptExecutorRuntime.callOnUnload(this.context, this.recordError.bind(this))
      ScriptExecutorRuntime.unregisterHooks(this.app, this.listeners, this.recordError.bind(this))
    } catch (cleanupErr) {
      const hyperfyError = cleanupErr instanceof HyperfyError ? cleanupErr : new HyperfyError('SCRIPT_ERROR', `Cleanup error: ${cleanupErr.message}`, { originalError: cleanupErr.toString() })
      this.recordError(hyperfyError, 'cleanup')
      logger.error('Cleanup error:', hyperfyError)
    } finally {
      this.context = null
      this.script = null
      this.listeners = { fixedUpdate: null, update: null, lateUpdate: null }
    }
  }

  getErrors(phase = null) {
    return phase ? this.executionErrors.filter(e => e.phase === phase) : this.executionErrors
  }

  getLastError() {
    return this.executionErrors[this.executionErrors.length - 1] || null
  }

  clearErrors() {
    this.executionErrors = []
  }
}
