import * as THREE from './three.js'

export class BufferedLerpQuaternion {
  constructor(target, speed) {
    this.target = target
    this.speed = speed
    this.queue = []
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
    const currentQuat = new THREE.Quaternion(
      this.target.x,
      this.target.y,
      this.target.z,
      this.target.w
    )

    if (this.queue.length === 1) {
      const progress = Math.min(1, (now - current.time) / timeWindow)
      const targetQuat = new THREE.Quaternion(
        current.value[0],
        current.value[1],
        current.value[2],
        current.value[3]
      )
      currentQuat.slerp(targetQuat, progress)
    } else {
      const next = this.queue[1]
      const segmentTime = next.time - current.time
      const elapsed = now - current.time
      const progress = Math.min(1, elapsed / segmentTime)

      const q1 = new THREE.Quaternion(current.value[0], current.value[1], current.value[2], current.value[3])
      const q2 = new THREE.Quaternion(next.value[0], next.value[1], next.value[2], next.value[3])
      q1.slerp(q2, progress)
      currentQuat.copy(q1)
    }

    this.target.x = currentQuat.x
    this.target.y = currentQuat.y
    this.target.z = currentQuat.z
    this.target.w = currentQuat.w
  }

  snap() {
    if (this.queue.length > 0) {
      const current = this.queue[0]
      this.target.x = current.value[0]
      this.target.y = current.value[1]
      this.target.z = current.value[2]
      this.target.w = current.value[3]
    }
  }
}
