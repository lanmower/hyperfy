import * as THREE from '../../extras/three.js'
import { DEG2RAD } from '../../extras/general.js'
import { BuilderConfig } from '../../config/SystemConfig.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'
import { copyTransform } from './BuilderTransformUtils.js'

const FORWARD = new THREE.Vector3(0, 0, -1)
const PROJECT_SPEED = 10
const PROJECT_MIN = 3

const { v1 } = SharedVectorPool('GrabModeHandler', 1)

export class GrabModeHandler {
  constructor(parent) {
    this.parent = parent
  }

  handle(delta) {
    const app = this.parent.clientBuilder.selected
    const target = this.parent.clientBuilder.target
    if (!app || !app.root || !target) return
    const hit = this.parent.clientBuilder.getHitAtReticle(app, true)

    const camPos = this.parent.clientBuilder.rig.position
    const camDir = v1.copy(FORWARD).applyQuaternion(this.parent.clientBuilder.rig.quaternion)
    const hitDistance = hit ? hit.point.distanceTo(camPos) : 0

    if (hit && hitDistance < target.limit) {
      target.position.copy(hit.point)
    } else {
      target.position.copy(camPos).add(camDir.multiplyScalar(target.limit))
    }

    let project = this.parent.clientBuilder.control.keyF.down ? 1 : this.parent.clientBuilder.control.keyC.down ? -1 : null
    if (project) {
      const multiplier = this.parent.clientBuilder.control.shiftLeft.down ? 4 : 1
      target.limit += project * PROJECT_SPEED * delta * multiplier
      if (target.limit < PROJECT_MIN) target.limit = PROJECT_MIN
      if (hitDistance && target.limit > hitDistance) target.limit = hitDistance
    }

    if (this.parent.clientBuilder.control.shiftLeft.down) {
      const scaleFactor = 1 + this.parent.clientBuilder.control.scrollDelta.value * 0.1 * delta
      if (target.scale) target.scale.multiplyScalar(scaleFactor)
    }
    else {
      if (target.rotation) target.rotation.y += this.parent.clientBuilder.control.scrollDelta.value * 0.1 * delta
    }

    copyTransform(target, app.root)

    if (app.threeScene && !app.blueprint?.scene) {
      copyTransform(app.root, app.threeScene)
    }

    if (!this.parent.clientBuilder.control.controlLeft.down) {
      if (target.rotation) {
        const newY = target.rotation.y
        const degrees = newY / DEG2RAD
        const snappedDegrees = Math.round(degrees / BuilderConfig.SNAP_DEGREES) * BuilderConfig.SNAP_DEGREES
        if (app.root.rotation) app.root.rotation.y = snappedDegrees * DEG2RAD
      }
    }

    app.root.clean()

    if (!this.parent.clientBuilder.control.controlLeft.down) {
      for (const pos of app.snaps) {
        const result = this.parent.clientBuilder.snaps.octree.query(pos, BuilderConfig.SNAP_DISTANCE)[0]
        if (result) {
          const offset = v1.copy(result.position).sub(pos)
          if (app.root.position) app.root.position.add(offset)
          if (app.threeScene && !app.blueprint?.scene && app.root.position) {
            app.threeScene.position.copy(app.root.position)
          }
          break
        }
      }
    }
  }
}
