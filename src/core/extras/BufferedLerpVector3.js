export class BufferedLerpVector3 {
  constructor() {
    this.current = { x: 0, y: 0, z: 0 }
    this.target = { x: 0, y: 0, z: 0 }
  }

  update(delta, speed) {
    const lerp = (a, b, t) => a + (b - a) * t
    const t = Math.min(1, delta * speed)

    this.current.x = lerp(this.current.x, this.target.x, t)
    this.current.y = lerp(this.current.y, this.target.y, t)
    this.current.z = lerp(this.current.z, this.target.z, t)
  }

  setTarget(x, y, z) {
    this.target.x = x
    this.target.y = y
    this.target.z = z
  }
}
