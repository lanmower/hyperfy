import * as THREE from '../../extras/three.js'
import { DEG2RAD } from '../../extras/general.js'
import { BuilderConfig } from '../../config/SystemConfig.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'
import { BaseBuilderHandler } from './BaseBuilderHandler.js'
import { copyTransform } from './BuilderTransformUtils.js'

const FORWARD = new THREE.Vector3(0, 0, -1)
const PROJECT_SPEED = 10
const PROJECT_MIN = 3

const { v1 } = SharedVectorPool('GrabModeHandler', 1)

export class GrabModeHandler extends BaseBuilderHandler {
  constructor(parent) {
    super(parent, 'GrabModeHandler')
  }

  handle(delta) {
    try {
      const app = this.parent.clientBuilder.selected
      const target = this.parent.clientBuilder.target
      if (!app || !app.root || !target) return

      const hit = this.parent.clientBuilder.getHitAtReticle(app, true)
      this.updateTargetPosition(target, hit)
      this.updateProjection(target, delta, hit)
      this.updateRotationOrScale(target, delta)
      this.applyTransformToApp(app, target)
      this.applyRotationSnap(app, target)
      this.applyPositionSnap(app, target)
    } catch (err) {
      this.logger.error('Grab mode update failed', { error: err.message })
    }
  }

  updateTargetPosition(target, hit) {
    const camPos = this.parent.clientBuilder.rig.position
    const camDir = v1.copy(FORWARD).applyQuaternion(this.parent.clientBuilder.rig.quaternion)
    const hitDistance = hit ? hit.point.distanceTo(camPos) : 0

    if (hit && hitDistance < target.limit) {
      target.position.copy(hit.point)
    } else {
      target.position.copy(camPos).add(camDir.multiplyScalar(target.limit))
    }
  }

  updateProjection(target, delta, hit) {
    const camPos = this.parent.clientBuilder.rig.position
    const project = this.parent.clientBuilder.control.keyF.down ? 1 : this.parent.clientBuilder.control.keyC.down ? -1 : null
    if (!project) return

    const multiplier = this.parent.clientBuilder.control.shiftLeft.down ? 4 : 1
    target.limit += project * PROJECT_SPEED * delta * multiplier
    target.limit = Math.max(target.limit, PROJECT_MIN)

    if (hit) {
      const hitDistance = hit.point.distanceTo(camPos)
      target.limit = Math.min(target.limit, hitDistance)
    }
  }

  updateRotationOrScale(target, delta) {
    const scrollValue = this.parent.clientBuilder.control.scrollDelta.value
    if (this.parent.clientBuilder.control.shiftLeft.down) {
      const scaleFactor = 1 + scrollValue * 0.1 * delta
      if (target.scale) target.scale.multiplyScalar(scaleFactor)
    } else {
      if (target.rotation) target.rotation.y += scrollValue * 0.1 * delta
    }
  }

  applyTransformToApp(app, target) {
    copyTransform(target, app.root)
    if (app.threeScene && !app.blueprint?.scene) {
      copyTransform(app.root, app.threeScene)
    }
  }

  applyRotationSnap(app, target) {
    if (this.parent.clientBuilder.control.controlLeft.down) return
    if (!target.rotation) return

    const newY = target.rotation.y
    const degrees = newY / DEG2RAD
    const snappedDegrees = Math.round(degrees / BuilderConfig.SNAP_DEGREES) * BuilderConfig.SNAP_DEGREES
    if (app.root.rotation) {
      app.root.rotation.y = snappedDegrees * DEG2RAD
    }
    app.root.clean()
  }

  applyPositionSnap(app, target) {
    if (this.parent.clientBuilder.control.controlLeft.down) return

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
