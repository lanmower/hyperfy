export class BufferedLerpVector3 {
  constructor(value, buffer = 0.2) {
    this.value = value // this gets written-to each update
    this.buffer = buffer
    this.localTime = 0
    this.snapToken = null
    this.lastPush = 0

    this.samples = []
    for (let i = 0; i < 3; i++) {
      this.samples.push({
        time: 0,
        value: value.clone(),
      })
    }
    this.writeIndex = 0
  }

  push(inV, snapToken = null) {
    if (this.snapToken !== snapToken) {
      this.snapToken = snapToken
      for (let samp of this.samples) {
        if (Array.isArray(inV)) {
          samp.value.fromArray(inV)
        } else {
          samp.value.copy(inV)
        }
        samp.time = this.localTime
      }
      this.writeIndex = 0
    } else {
      this.writeIndex = (this.writeIndex + 1) % 3
      const samp = this.samples[this.writeIndex]
      if (Array.isArray(inV)) {
        samp.value.fromArray(inV)
      } else {
        samp.value.copy(inV)
      }
      samp.time = this.localTime
    }
  }

  /**
   * Call once per frame with your frame‐delta in seconds.
   */
  update(delta) {
    this.localTime += delta
    const tRender = this.localTime - this.buffer

    let older = null,
      newer = null
    let tOlder = -Infinity,
      tNewer = Infinity

    for (let samp of this.samples) {
      const t = samp.time
      if (t <= tRender && t > tOlder) {
        tOlder = t
        older = samp
      }
      if (t >= tRender && t < tNewer) {
        tNewer = t
        newer = samp
      }
    }

    if (older && newer && newer !== older && tNewer > tOlder) {
      let alpha = (tRender - tOlder) / (tNewer - tOlder)
      alpha = Math.min(Math.max(alpha, 0), 1)
      this.value.lerpVectors(older.value, newer.value, alpha)
    } else if (older) {
      this.value.copy(older.value)
    } else if (newer) {
      this.value.copy(newer.value)
    }

    return this
  }

  /**
   * Instantly jump your localTime to latest+buffer
   */
  snap() {
    let latest = this.samples[0]
    for (let samp of this.samples) {
      if (samp.time > latest.time) latest = samp
    }
    this.localTime = latest.time + this.buffer
    this.value.copy(latest.value)
  }
}
