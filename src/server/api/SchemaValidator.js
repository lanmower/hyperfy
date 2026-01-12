export class Validators {
  static validate(data, schema) {
    const errors = []
    const messages = []

    for (const [key, rule] of Object.entries(schema)) {
      const value = data[key]

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: key, message: `${key} is required` })
        messages.push(`${key} is required`)
        continue
      }

      if (value !== undefined && value !== null) {
        if (rule.type) {
          const expectedType = Array.isArray(rule.type) ? rule.type : [rule.type]
          const actualType = Array.isArray(value) ? 'array' : typeof value
          if (!expectedType.includes(actualType)) {
            errors.push({
              field: key,
              message: `${key} must be of type ${expectedType.join(' or ')}`
            })
            messages.push(`${key} must be of type ${expectedType.join(' or ')}`)
          }
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({ field: key, message: `${key} does not match required pattern` })
          messages.push(`${key} does not match required pattern`)
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: key,
            message: `${key} must be at least ${rule.minLength} characters`
          })
          messages.push(`${key} must be at least ${rule.minLength} characters`)
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: key,
            message: `${key} must be no more than ${rule.maxLength} characters`
          })
          messages.push(`${key} must be no more than ${rule.maxLength} characters`)
        }

        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: key,
            message: `${key} must be at least ${rule.min}`
          })
          messages.push(`${key} must be at least ${rule.min}`)
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: key,
            message: `${key} must be no more than ${rule.max}`
          })
          messages.push(`${key} must be no more than ${rule.max}`)
        }

        if (rule.enum && !rule.enum.includes(value)) {
          errors.push({
            field: key,
            message: `${key} must be one of: ${rule.enum.join(', ')}`
          })
          messages.push(`${key} must be one of: ${rule.enum.join(', ')}`)
        }

        if (rule.custom) {
          const customError = rule.custom(value)
          if (customError) {
            errors.push({ field: key, message: customError })
            messages.push(customError)
          }
        }
      }
    }

    return {
      valid: !errors.length,
      errors,
      messages
    }
  }
}
