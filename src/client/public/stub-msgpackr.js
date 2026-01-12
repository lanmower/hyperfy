export class Packr {
  constructor(options = {}) {
    this.options = options
  }

  pack(value) {
    return new Uint8Array(0)
  }

  unpack(buffer) {
    return null
  }
}

export default { Packr }
