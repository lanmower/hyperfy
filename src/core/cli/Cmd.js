// Command decorator factory - reduces CLI registration boilerplate

export const Cmd = {
  build: (handler, opts = {}) => ({
    handler,
    description: opts.desc || '',
    args: opts.args || [],
    group: opts.group || 'default',
    aliases: opts.alias || [],
    hidden: opts.hidden || false
  }),

  batch: (commands) => {
    const map = {}
    for (const [name, config] of Object.entries(commands)) {
      map[name] = Cmd.build(config.handler, config)
    }
    return map
  },

  typed: (fn, typeMap) => async (args) => {
    const converted = {}
    for (let i = 0; i < args.length; i++) {
      const key = Object.keys(typeMap)[i]
      if (!key) break
      const type = typeMap[key]
      converted[key] = type === 'number' ? Number(args[i]) : type === 'bool' ? args[i] === 'true' : args[i]
    }
    return fn(converted)
  }
}

export function cmd(handler, opts = {}) {
  return Cmd.build(handler, opts)
}
