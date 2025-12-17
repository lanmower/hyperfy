const spheres = new Map()

const _raycastHit = {
  handle: null,
  point: null,
  normal: null,
  distance: null,
}

const _sweepHit = {
  actor: null,
  point: null,
  normal: null,
  distance: null,
}

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
  }

  raycast(origin, direction, maxDistance = Infinity, layerMask) {
    origin = origin.toPxVec3(this.physics._pv1)
    direction = direction.toPxVec3(this.physics._pv2)
    this.physics.queryFilterData.data.word0 = layerMask
    this.physics.queryFilterData.data.word1 = 0
    const didHit = this.physics.scene.raycast(
      origin,
      direction,
      maxDistance,
      this.physics.raycastResult,
      PHYSX.PxHitFlagEnum.eNORMAL,
      this.physics.queryFilterData
    )
    if (didHit) {
      const numHits = this.physics.raycastResult.getNbAnyHits()
      let hit
      for (let n = 0; n < numHits; n++) {
        const nHit = this.physics.raycastResult.getAnyHit(n)
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
    origin.toPxVec3(this.physics.sweepPose.p)
    direction = direction.toPxVec3(this.physics._pv2)
    this.physics.queryFilterData.data.word0 = layerMask
    this.physics.queryFilterData.data.word1 = 0
    const didHit = this.physics.scene.sweep(
      geometry,
      this.physics.sweepPose,
      direction,
      maxDistance,
      this.physics.sweepResult,
      PHYSX.PxHitFlagEnum.eDEFAULT,
      this.physics.queryFilterData
    )
    if (didHit) {
      const numHits = this.physics.sweepResult.getNbAnyHits()
      let hit
      for (let n = 0; n < numHits; n++) {
        const nHit = this.physics.sweepResult.getAnyHit(n)
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
    origin.toPxVec3(this.physics.overlapPose.p)
    const geometry = getSphereGeometry(radius)
    this.physics.queryFilterData.data.word0 = layerMask
    this.physics.queryFilterData.data.word1 = 0
    const didHit = this.physics.scene.overlap(geometry, this.physics.overlapPose, this.physics.overlapResult, this.physics.queryFilterData)
    if (!didHit) return []
    overlapHits.length = 0
    const numHits = this.physics.overlapResult.getNbAnyHits()
    for (let n = 0; n < numHits; n++) {
      const nHit = this.physics.overlapResult.getAnyHit(n)
      const hit = getOrCreateOverlapHit(n)
      hit.actor = nHit.actor
      hit.handle = this.physics.handles.get(nHit.actor.ptr)
      overlapHits.push(hit)
    }
    return overlapHits
  }
}
