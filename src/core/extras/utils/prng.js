/**
 * Pseudorandom Number Generator
 * -----------------------------
 * Implementation taken from the `prng` and `lfrs` NPM packages
 * and modernized to work with newer build tools and ES6+
 */

const DEFAULT_SEED = 149304961039362642461
const REGISTER_LENGTH = 31
const FLUSH_TIMES = 20


export function prng(seed) {
  const generator = new PRNG(seed)
  return (min, max, dp = 0) => {
    if (max === undefined) {
      max = min
      min = 0
    }

    if (min > max) [min, max] = [max, min]

    if (dp > 0) {
      const scale = 10 ** dp
      const intMin = Math.ceil(min * scale)
      const intMax = Math.floor(max * scale)
      const rndInt = generator.rand(intMin, intMax)
      return rndInt / scale
    }

    return generator.rand(min, max)
  }
}

class PRNG {
  constructor(seed) {
    this.lfsr = new LFSR(REGISTER_LENGTH, seed || DEFAULT_SEED)
    this.lfsr.seq(FLUSH_TIMES * REGISTER_LENGTH)
  }
  rand(min, max) {
    if (!max) {
      max = min
      min = 0
    }

    if (min > max) {
      let t = max
      max = min
      min = t
    }

    let offset = min

    let bits = ~~this._log2(max - offset) + 1
    let random
    do {
      random = this.lfsr.seq(bits)
    } while (random > max - offset)
    return random + offset
  }
  _log2(n) {
    return Math.log(n) / Math.LN2
  }
}

const TAPS = {
  2: [2, 1], // 3
  3: [3, 2], // 7
  4: [4, 3], // 15
  5: [5, 3], // 31
  6: [6, 5], // 63
  7: [7, 6], // 127
  8: [8, 6, 5, 4], // 255
  9: [9, 5], // 511
  10: [10, 7], // 1023
  11: [11, 9], // 2027
  12: [12, 11, 10, 4], // 4095
  13: [13, 12, 11, 8], // 8191
  14: [14, 13, 12, 2], // 16383
  15: [15, 14], // 32767
  16: [16, 14, 13, 11], // 65535
  17: [17, 14], // 131071
  18: [18, 11], // 262143
  19: [19, 18, 17, 14], // 524287
  20: [20, 17],
  21: [21, 19],
  22: [22, 21],
  23: [23, 18],
  24: [24, 23, 22, 17],
  25: [25, 22],
  26: [26, 6, 2, 1],
  27: [27, 5, 2, 1],
  28: [28, 25],
  29: [29, 27],
  30: [30, 6, 4, 1],
  31: [31, 28],
}

const DEFAULT_LENGTH = 31

class LFSR {
  constructor(n, seed) {
    this.n = n || DEFAULT_LENGTH
    this.taps = TAPS[this.n]
    seed = seed || this._defaultSeed(this.n)
    const mask = parseInt(Array(this.n + 1).join('1'), 2)
    this.register = seed & mask
  }
  shift() {
    let tapsNum = this.taps.length
    let i
    let bit = this.register >> (this.n - this.taps[0])
    for (let i = 1; i < tapsNum; i++) {
      bit = bit ^ (this.register >> (this.n - this.taps[i]))
    }
    bit = bit & 1
    this.register = (this.register >> 1) | (bit << (this.n - 1))
    return bit & 1
  }
  seq(n) {
    let seq = 0
    for (let i = 0; i < n; i++) {
      seq = (seq << 1) | this.shift()
    }
    return seq
  }
  seqString(n) {
    let seq = ''
    for (let i = 0; i < n; i++) {
      seq += this.shift()
    }
    return seq
  }
  maxSeqLen() {
    let initialState = this.register
    let counter = 0
    do {
      this.shift()
      counter++
    } while (initialState != this.register)
    return counter
  }
  _defaultSeed(n) {
    if (!n) throw new Error('n is required')
    let lfsr = new LFSR(8, 92914)
    return lfsr.seq(n)
  }
}
