const serialize = (obj) => JSON.stringify(obj)
const deserialize = (str) => JSON.parse(str)

export const Serialization = { serialize, deserialize }
