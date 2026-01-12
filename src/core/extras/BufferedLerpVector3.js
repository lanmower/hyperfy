export class BufferedLerpVector3 {
  constructor(target, speed) {
    this.target = target
    this.speed = speed
    this.queue = []
    this.lastTime = performance.now()
  }

  push(value, teleportId) {
    this.queue.push({ value, time: performance.now(), teleportId })
  }

  pushArray(value) {
    this.queue.push({ value, time: performance.now() })
  }

  update(delta) {
    const now = performance.now()
    const timeWindow = this.speed

    while (this.queue.length > 1) {
      const next = this.queue[1]
      if (now - this.queue[0].time >= timeWindow) {
        this.queue.shift()
      } else {
        break
      }
    }

    if (this.queue.length === 0) return

    const current = this.queue[0]
    const currentPos = [this.target.x, this.target.y, this.target.z]
    const targetPos = current.value

    if (this.queue.length === 1) {
      const progress = Math.min(1, (now - current.time) / timeWindow)
      this.target.x = currentPos[0] + (targetPos[0] - currentPos[0]) * progress
      this.target.y = currentPos[1] + (targetPos[1] - currentPos[1]) * progress
      this.target.z = currentPos[2] + (targetPos[2] - currentPos[2]) * progress
    } else {
      const next = this.queue[1]
      const segmentTime = next.time - current.time
      const elapsed = now - current.time
      const progress = Math.min(1, elapsed / segmentTime)

      this.target.x = current.value[0] + (next.value[0] - current.value[0]) * progress
      this.target.y = current.value[1] + (next.value[1] - current.value[1]) * progress
      this.target.z = current.value[2] + (next.value[2] - current.value[2]) * progress
    }
  }

  snap() {
    if (this.queue.length > 0) {
      const current = this.queue[0]
      this.target.x = current.value[0]
      this.target.y = current.value[1]
      this.target.z = current.value[2]
    }
  }
}
