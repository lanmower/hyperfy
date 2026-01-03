import { InputSanitizerValidators } from './InputSanitizerValidators.js'
import { InputSanitizerPatterns } from './InputSanitizerPatterns.js'

export class InputSanitizer {
  static validateScript(scriptCode) {
    return InputSanitizerValidators.validateScript(scriptCode)
  }

  static validateProperties(props, depth = 0) {
    return InputSanitizerValidators.validateProperties(props, depth)
  }

  static validateURL(url) {
    return InputSanitizerPatterns.validateURL(url)
  }

  static validateFilePath(filePath) {
    return InputSanitizerPatterns.validateFilePath(filePath)
  }

  static validateRegex(pattern) {
    return InputSanitizerPatterns.validateRegex(pattern)
  }

  static validateEntityData(data) {
    return InputSanitizerValidators.validateEntityData(data)
  }
}
