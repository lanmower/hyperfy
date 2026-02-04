import * as THREE from '../../extras/three.js'
import { Layers } from '../../extras/Layers.js'

const spheres = new Map()
const _raycastHit = { handle: null, point: new THREE.Vector3(), normal: new THREE.Vector3(), distance: null }
const _sweepHit = { actor: null, point: new THREE.Vector3(), normal: new THREE.Vector3(), distance: null }
const overlapHitPool = []
const overlapHits = []

function getSphereGeometry(radius) {
  let sphere = spheres.get(radius)
  if (!sphere) {
    sphere = new PHYSX.PxSphereGeometry(radius)
    spheres.set(radius, sphere)
  }
  return sphere
}

function getOrCreateOverlapHit(idx) {
  let hit = overlapHitPool[idx]
  if (!hit) {
    hit = {
      actor: null,
      handle: null,
      proxy: {
        get tag() {
          return hit.handle?.tag || null
        },
        get playerId() {
          return hit.handle?.playerId || null
        },
      },
    }
    overlapHitPool.push(hit)
  }
  return hit
}

export class PhysicsQueries {
  constructor(physics) {
    this.physics = physics
    this.raycastResult = new PHYSX.PxRaycastResult()
    this.sweepPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.sweepResult = new PHYSX.PxSweepResult()
    this.overlapPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.overlapResult = new PHYSX.PxOverlapResult()
    this.queryFilterData = new PHYSX.PxQueryFilterData()
    this._pv1 = new PHYSX.PxVec3()
    this._pv2 = new PHYSX.PxVec3()
  }

  raycast(origin, direction, maxDistance = Infinity, layerMask) {
    origin = origin.toPxVec3(this._pv1)
    direction = direction.toPxVec3(this._pv2)
    this.queryFilterData.data.word0 = layerMask
    this.queryFilterData.data.word1 = 0
    const didHit = this.physics.scene.raycast(
      origin,
      direction,
      maxDistance,
      this.raycastResult,
      PHYSX.PxHitFlagEnum.eNORMAL,
      this.queryFilterData
    )
    if (didHit) {
      const numHits = this.raycastResult.getNbAnyHits()
      let hit
      for (let n = 0; n < numHits; n++) {
        const nHit = this.raycastResult.getAnyHit(n)
        if (!hit || hit.distance > nHit.distance) {
          hit = nHit
        }
      }
      _raycastHit.handle = this.physics.handles.get(hit.actor.ptr)
      _raycastHit.point.set(hit.position.x, hit.position.y, hit.position.z)
      _raycastHit.normal.set(hit.normal.x, hit.normal.y, hit.normal.z)
      _raycastHit.distance = hit.distance
      return _raycastHit
    }
  }

  sweep(geometry, origin, direction, maxDistance, layerMask) {
    origin.toPxVec3(this.sweepPose.p)
    direction = direction.toPxVec3(this._pv2)
    this.queryFilterData.data.word0 = layerMask
    this.queryFilterData.data.word1 = 0
    const didHit = this.physics.scene.sweep(
      geometry,
      this.sweepPose,
      direction,
      maxDistance,
      this.sweepResult,
      PHYSX.PxHitFlagEnum.eDEFAULT,
      this.queryFilterData
    )
    if (didHit) {
      const numHits = this.sweepResult.getNbAnyHits()
      let hit
      for (let n = 0; n < numHits; n++) {
        const nHit = this.sweepResult.getAnyHit(n)
        if (!hit || hit.distance > nHit.distance) {
          hit = nHit
        }
      }
      _sweepHit.actor = hit.actor
      _sweepHit.point.set(hit.position.x, hit.position.y, hit.position.z)
      _sweepHit.normal.set(hit.normal.x, hit.normal.y, hit.normal.z)
      _sweepHit.distance = hit.distance
      return _sweepHit
    }
  }

  overlapSphere(radius, origin, layerMask) {
    origin.toPxVec3(this.overlapPose.p)
    const geometry = getSphereGeometry(radius)
    this.queryFilterData.data.word0 = layerMask
    this.queryFilterData.data.word1 = 0
    const didHit = this.physics.scene.overlap(geometry, this.overlapPose, this.overlapResult, this.queryFilterData)
    if (!didHit) return []
    overlapHits.length = 0
    const numHits = this.overlapResult.getNbAnyHits()
    for (let n = 0; n < numHits; n++) {
      const nHit = this.overlapResult.getAnyHit(n)
      const hit = getOrCreateOverlapHit(n)
      hit.actor = nHit.actor
      hit.handle = this.physics.handles.get(nHit.actor.ptr)
      overlapHits.push(hit)
    }
    return overlapHits
  }
}
