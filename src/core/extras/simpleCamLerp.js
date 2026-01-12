import { Vec3, Quat } from './playcanvas.js'
import { Vector3, Quaternion } from './three.js'
import { Layers } from './Layers.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const BACKWARD = new Vector3(0, 0, 1)

const { v1 } = SharedVectorPool('simpleCamLerp', 1)

let sweepGeometry

const smoothing = 20
const MAX_CAM_DISTANCE = 0.4

function slerpQuat(q1, q2, t, result) {
  let dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w
  let q2x = q2.x, q2y = q2.y, q2z = q2.z, q2w = q2.w

  if (dot < 0) {
    q2x = -q2x; q2y = -q2y; q2z = -q2z; q2w = -q2w
    dot = -dot
  }

  dot = Math.max(-1, Math.min(1, dot))

  const theta = Math.acos(dot)
  const sinTheta = Math.sin(theta)

  if (sinTheta < 0.001) {
    result.x = q1.x + (q2x - q1.x) * t
    result.y = q1.y + (q2y - q1.y) * t
    result.z = q1.z + (q2z - q1.z) * t
    result.w = q1.w + (q2w - q1.w) * t
  } else {
    const s0 = Math.sin((1 - t) * theta) / sinTheta
    const s1 = Math.sin(t * theta) / sinTheta

    result.x = q1.x * s0 + q2x * s1
    result.y = q1.y * s0 + q2y * s1
    result.z = q1.z * s0 + q2z * s1
    result.w = q1.w * s0 + q2w * s1
  }

  const len = Math.sqrt(result.x * result.x + result.y * result.y + result.z * result.z + result.w * result.w)
  if (len > 0.001) {
    result.x /= len
    result.y /= len
    result.z /= len
    result.w /= len
  }
}

export function simpleCamLerp(world, camera, target, delta) {
  if (!world || !camera || !target) return

  target.quaternion.setFromEuler(target.rotation)

  const alpha = 1.0 - Math.exp(-smoothing * delta)
  const result = new Quat()
  slerpQuat(camera.quaternion, target.quaternion, alpha, result)
  camera.quaternion.copy(result)

  camera.position.copy(target.position)

  if (!sweepGeometry) sweepGeometry = new PHYSX.PxSphereGeometry(0.2)
  const origin = new Vector3(camera.position.x, camera.position.y, camera.position.z)
  const threeQuat = new Quaternion(camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w)
  const direction = new Vector3(BACKWARD.x, BACKWARD.y, BACKWARD.z).applyQuaternion(threeQuat)
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
