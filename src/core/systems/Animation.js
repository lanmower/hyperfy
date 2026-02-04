import { System } from './System.js'
import * as THREE from '../extras/three.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const { v1 } = SharedVectorPool('Animation', 1)

const BATCH_SIZE = 10

export class Animation extends System {
  constructor(world) {
    super(world)
    this.apps = []
    this.cursor = 0
  }

  init() {
    this.world.entities.on('added', this.onAdded)
    this.world.entities.on('removed', this.onRemoved)
  }

  onAdded = entity => {
    if (!entity.isApp) return
    this.apps.push(entity)
  }

  onRemoved = entity => {
    if (!entity.isApp) return
    const idx = this.apps.indexOf(entity)
    if (idx === -1) return
    this.apps.splice(idx, 1)
  }

  update() {
    if (!this.apps.length) return
    const camPos = v1.setFromMatrixPosition(this.world.camera.matrixWorld)
    const batch = Math.min(BATCH_SIZE, this.apps.length)
    for (let i = 0; i < batch; i++) {
      const app = this.apps[this.cursor % this.apps.length]
      if (!app.root) {
        this.cursor++
        continue
      }
      const appPos = app.root.position
      const distance = camPos.distanceTo(appPos)
      if (distance < 30) {
        app.animateRate = 0.001
      } else if (distance < 80) {
        app.animateRate = 1 / 30
      } else {
        app.animateRate = 1 / 20
      }
      this.cursor++
    }
  }

  destroy() {
    this.apps = []
  }
}
