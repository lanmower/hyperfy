import { StructuredLogger } from '../../utils/logging/index.js'
import { HyperfyError } from '../../utils/errors/HyperfyError.js'

const logger = new StructuredLogger('ScriptExecutorRuntime')

export class ScriptExecutorRuntime {
  static parseScript(scriptCode, scripts) {
    try {
      if (typeof scriptCode === 'string') {
        return scripts.evaluate(scriptCode)
      } else if (scriptCode.exec && scriptCode.code) {
        return scriptCode
      }
    } catch (parseErr) {
      const hyperfyError = parseErr instanceof HyperfyError ? parseErr : new HyperfyError('SCRIPT_ERROR', `Script parsing failed: ${parseErr.message}`, { originalError: parseErr.toString() })
      throw hyperfyError
    }
  }

  static executeScript(evaluated, worldProxy, appProxy, fetchFn, safeProps, setTimeoutFn) {
    try {
      return evaluated.exec(worldProxy, appProxy, fetchFn, safeProps, setTimeoutFn)
    } catch (execErr) {
      logger.error('Script execution error:', { message: execErr.message, stack: execErr.stack })
      const hyperfyError = execErr instanceof HyperfyError ? execErr : new HyperfyError('SCRIPT_ERROR', `Script execution failed: ${execErr.message}`, { originalError: execErr.toString() })
      throw hyperfyError
    }
  }

  static registerHooks(app, appContext, recordError) {
    const listeners = { fixedUpdate: null, update: null, lateUpdate: null }
    try {
      if (appContext.fixedUpdate && typeof appContext.fixedUpdate === 'function') {
        listeners.fixedUpdate = appContext.fixedUpdate
        app.on('fixedUpdate', listeners.fixedUpdate)
      }
      if (appContext.update && typeof appContext.update === 'function') {
        listeners.update = appContext.update
        app.on('update', listeners.update)
      }
      if (appContext.lateUpdate && typeof appContext.lateUpdate === 'function') {
        listeners.lateUpdate = appContext.lateUpdate
        app.on('lateUpdate', listeners.lateUpdate)
      }
      if (appContext.onLoad && typeof appContext.onLoad === 'function') {
        try {
          appContext.onLoad()
        } catch (onLoadErr) {
          const hyperfyError = onLoadErr instanceof HyperfyError ? onLoadErr : new HyperfyError('SCRIPT_ERROR', `onLoad failed: ${onLoadErr.message}`, { originalError: onLoadErr.toString() })
          recordError(hyperfyError, 'onLoad')
          logger.error('onLoad failed, stopping execution:', hyperfyError)
          throw hyperfyError
        }
      }
      return listeners
    } catch (hookErr) {
      const hyperfyError = hookErr instanceof HyperfyError ? hookErr : new HyperfyError('SCRIPT_ERROR', `Failed to register script hooks: ${hookErr.message}`, { originalError: hookErr.toString() })
      recordError(hyperfyError, 'hookRegistration')
      logger.error('Hook registration failed:', hyperfyError)
      throw hyperfyError
    }
  }

  static unregisterHooks(app, listeners, recordError) {
    try {
      if (listeners.fixedUpdate && app) app.off('fixedUpdate', listeners.fixedUpdate)
      if (listeners.update && app) app.off('update', listeners.update)
      if (listeners.lateUpdate && app) app.off('lateUpdate', listeners.lateUpdate)
    } catch (cleanupErr) {
      const hyperfyError = cleanupErr instanceof HyperfyError ? cleanupErr : new HyperfyError('SCRIPT_ERROR', `Cleanup error: ${cleanupErr.message}`, { originalError: cleanupErr.toString() })
      recordError(hyperfyError, 'cleanup')
      logger.error('Cleanup error:', hyperfyError)
    }
  }

  static callOnUnload(appContext, recordError) {
    try {
      if (appContext?.onUnload && typeof appContext.onUnload === 'function') {
        try {
          appContext.onUnload()
        } catch (err) {
          const hyperfyError = err instanceof HyperfyError ? err : new HyperfyError('SCRIPT_ERROR', `onUnload failed: ${err.message}`, { originalError: err.toString() })
          recordError(hyperfyError, 'onUnload')
          logger.error('onUnload failed:', hyperfyError)
        }
      }
    } catch (err) {
      logger.error('Error calling onUnload:', err)
    }
  }
}
