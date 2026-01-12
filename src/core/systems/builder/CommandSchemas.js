const createValidator = (rules) => ({
  parse: (data) => {
    for (const [key, validate] of Object.entries(rules)) {
      if (validate && !validate(data?.[key])) {
        throw new Error(`Invalid ${key}`)
      }
    }
  }
})

export const EntityCommandSchemas = {
  unlink: null,
  pin: null,
  duplicate: null,
  delete: null,
}

export const TransformSchemas = {
  handleModeUpdates: createValidator({
    delta: v => typeof v === 'number' && v > 0,
    mode: v => ['translate', 'rotate', 'scale', 'grab'].includes(v),
  }),
  sendSelectedUpdates: createValidator({
    delta: v => typeof v === 'number' && v > 0,
  }),
}

export const StateTransitionSchemas = {
  toggle: null,
  setMode: createValidator({
    mode: v => ['grab', 'translate', 'rotate', 'scale'].includes(v),
  }),
  select: null,
}

export const FileDropSchemas = {
  onDrop: createValidator({
    file: v => v instanceof File,
  }),
}

export const GrabModeSchemas = {
  handle: createValidator({
    delta: v => typeof v === 'number' && v > 0,
  }),
}
