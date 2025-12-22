const serialize = (obj) => JSON.stringify(obj)
const deserialize = (str) => JSON.parse(str)
const cleanStack = (stack) => {
  if (!stack) return ''
  if (typeof stack !== 'string') return String(stack)
  return stack
}

export const Serialization = { serialize, deserialize, cleanStack }
