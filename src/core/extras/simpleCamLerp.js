import * as THREE from './three.js'
import { Layers } from './Layers.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const BACKWARD = new THREE.Vector3(0, 0, 1)

const { v1 } = SharedVectorPool('simpleCamLerp', 1)

let sweepGeometry

const smoothing = 20
const MAX_CAM_DISTANCE = 0.4

export function simpleCamLerp(world, camera, target, delta) {
  if (!world || !camera || !target) return

  target.quaternion.setFromEuler(target.rotation)

  const alpha = 1.0 - Math.exp(-smoothing * delta)
  camera.quaternion.slerp(target.quaternion, alpha)

  camera.position.copy(target.position)

  if (!sweepGeometry) sweepGeometry = new PHYSX.PxSphereGeometry(0.2)
  const origin = camera.position
  const direction = v1.copy(BACKWARD).applyQuaternion(camera.quaternion)
  const layerMask = Layers.camera.mask
  const hit = world.physics.sweep(sweepGeometry, origin, direction, 200, layerMask)

  let distance = target.zoom
  if (hit && hit.distance < distance) {
    camera.zoom = hit.distance
  } else {
    const alpha = 6 * delta
    camera.zoom += (distance - camera.zoom) * alpha
  }
}
