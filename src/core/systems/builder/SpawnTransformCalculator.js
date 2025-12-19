import * as THREE from '../../extras/three.js'
import { DEG2RAD, RAD2DEG } from '../../extras/general.js'

const SNAP_DISTANCE = 1
const SNAP_DEGREES = 5
const PROJECT_MAX = 50

const e1 = new THREE.Euler()
const q1 = new THREE.Quaternion()

export class SpawnTransformCalculator {
  constructor(builder) {
    this.builder = builder
  }

  calculate(atReticle) {
    const hit = atReticle
      ? this.builder.world.stage.raycastReticle()[0]
      : this.builder.world.stage.raycastPointer(this.builder.control.pointer.position)[0]

    const position = hit ? hit.point.toArray() : [0, 0, 0]

    let quaternion
    if (hit) {
      e1.copy(this.builder.world.rig.rotation).reorder('YXZ')
      e1.x = 0
      e1.z = 0
      const degrees = e1.y * RAD2DEG
      const snappedDegrees = Math.round(degrees / SNAP_DEGREES) * SNAP_DEGREES
      e1.y = snappedDegrees * DEG2RAD
      q1.setFromEuler(e1)
      quaternion = q1.toArray()
    } else {
      quaternion = [0, 0, 0, 1]
    }

    return { position, quaternion }
  }
}
