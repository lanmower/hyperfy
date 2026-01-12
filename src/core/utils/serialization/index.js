const serialize = (obj) => JSON.stringify(obj)
const deserialize = (str) => JSON.parse(str)

export const Serialization = {
  serialize,
  deserialize,

  serializeError(arg) {
    if (!(arg instanceof Error)) return arg

    return {
      __error: true,
      name: arg.name,
      message: arg.message,
      stack: arg.stack
    }
  },

  serializeValue(arg) {
    if (typeof arg === 'object' && arg !== null) {
      if (arg instanceof Error) {
        return this.serializeError(arg)
      }
      try {
        return JSON.parse(JSON.stringify(arg))
      } catch {
        return String(arg)
      }
    }
    return arg
  },

  serializeArgs(args) {
    try {
      return Array.from(args || []).map(arg => this.serializeValue(arg))
    } catch {
      return ['[Serialization Error]']
    }
  },

  cleanStack(stack) {
    if (!stack) return null

    return stack
      .split('\n')
      .filter(line => {
        return !line.includes('node_modules') &&
               !line.includes('webpack') &&
               !line.includes('<anonymous>') &&
               line.trim().length > 0
      })
      .slice(0, 10)
      .join('\n')
  }
}

export const serialization = Serialization
