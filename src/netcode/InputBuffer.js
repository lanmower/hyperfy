export class InputBuffer {
  constructor(maxSize = 128) {
    this.buffer = new Map()
    this.maxSize = maxSize
    this.nextSequence = 0
  }

  addInput(input) {
    const sequence = this.nextSequence++
    this.buffer.set(sequence, {
      sequence,
      timestamp: Date.now(),
      data: input
    })
    if (this.buffer.size > this.maxSize) {
      const oldest = Math.min(...this.buffer.keys())
      this.buffer.delete(oldest)
    }
    return sequence
  }

  getInput(sequence) {
    return this.buffer.get(sequence)
  }

  getInputsSince(sequence) {
    const inputs = []
    for (let i = sequence; i < this.nextSequence; i++) {
      const input = this.buffer.get(i)
      if (input) inputs.push(input)
    }
    return inputs
  }

  clear() {
    this.buffer.clear()
  }

  getSize() {
    return this.buffer.size
  }
}
