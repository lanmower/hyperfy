import { InputSanitizer } from '../../security/InputSanitizer.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { HyperfyError } from '../../utils/errors/HyperfyError.js'

const logger = new StructuredLogger('ScriptExecutorValidator')

export class ScriptExecutorValidator {
  static validateScriptCode(scriptCode, app, blueprint) {
    if (!scriptCode) return { valid: true, result: null }
    if (typeof scriptCode === 'string') {
      if (!scriptCode.trim().length) {
        logger.warn('Empty script code provided')
        return { valid: true, result: null }
      }
      const validation = InputSanitizer.validateScript(scriptCode)
      if (!validation.valid) {
        const hyperfyError = new HyperfyError('SCRIPT_VALIDATION_FAILED', 'Script contains dangerous patterns', {
          appId: app.data.id,
          blueprintId: blueprint?.id,
          violations: validation.violations,
        })
        return { valid: false, error: hyperfyError }
      }
      return { valid: true, result: scriptCode }
    } else if (scriptCode.exec && scriptCode.code) {
      return { valid: true, result: scriptCode }
    } else {
      const hyperfyError = new HyperfyError('TYPE_MISMATCH', `Invalid script format: ${typeof scriptCode}`, { phase: 'parseScript' })
      return { valid: false, error: hyperfyError }
    }
  }

  static validateProperties(props, app, blueprint) {
    const safeProps = props || {}
    const propValidation = InputSanitizer.validateProperties(safeProps)
    if (!propValidation.valid) {
      const hyperfyError = new HyperfyError('PROPERTY_VALIDATION_FAILED', 'Blueprint properties contain invalid data', {
        appId: app.data.id,
        blueprintId: blueprint?.id,
        violations: propValidation.violations,
      })
      return { valid: false, error: hyperfyError }
    }
    return { valid: true, result: safeProps }
  }

  static validateExecutedScript(evaluated) {
    if (!evaluated) {
      logger.warn('Script evaluation returned null')
      return { valid: true, result: null }
    }
    if (!evaluated.exec || typeof evaluated.exec !== 'function') {
      const hyperfyError = new HyperfyError('INVALID_STATE', 'Evaluated script has no exec function', { phase: 'executeScript' })
      return { valid: false, error: hyperfyError }
    }
    return { valid: true, result: evaluated }
  }

  static validateProxies(worldProxy, appProxy) {
    if (!worldProxy) {
      const hyperfyError = new HyperfyError('NULL_REFERENCE', 'World proxy not available', { phase: 'executeScript' })
      return { valid: false, error: hyperfyError }
    }
    if (!appProxy) {
      const hyperfyError = new HyperfyError('NULL_REFERENCE', 'App proxy not available', { phase: 'executeScript' })
      return { valid: false, error: hyperfyError }
    }
    return { valid: true }
  }
}
