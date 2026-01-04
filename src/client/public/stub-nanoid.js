export function nanoid() {
  return Math.random().toString(36).substring(2)
}

export function customAlphabet(alphabet, size) {
  return function() {
    let id = ''
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return id
  }
}

export default { nanoid, customAlphabet }
