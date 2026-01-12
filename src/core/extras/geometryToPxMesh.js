import * as THREE from './three.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('GeometryToPxMesh')
const cache = new Map()

class PMeshHandle {
  constructor(item) {
    this.value = item.pmesh
    this.item = item
    this.item.refs++
    this.released = false
  }

  release() {
    if (this.released) return
    this.item.refs--
    if (this.item.refs === 0) {
      this.item.pmesh.release()
      cache.delete(this.item.id)
    }
    this.released = true
    this.value = null
  }
}

export function geometryToPxMesh(world, geometry, convex) {
  const id = `${geometry.uuid}_${convex ? 'convex' : 'triangles'}`

  let item = cache.get(id)
  if (item) {
    return new PMeshHandle(item)
  }

  const cookingParams = world.physics.cookingParams

  let position = geometry.attributes.position
  const index = geometry.index

  if (position.isInterleavedBufferAttribute) {
    position = BufferGeometryUtils.deinterleaveAttribute(position)
    position = new THREE.BufferAttribute(new Float32Array(position.array), position.itemSize, false)
  }

  const positions = position.array
  const floatBytes = positions.length * positions.BYTES_PER_ELEMENT
  const pointsPtr = PHYSX._webidl_malloc(floatBytes)
  PHYSX.HEAPF32.set(positions, pointsPtr >> 2)

  let desc
  let pmesh

  if (convex) {
    desc = new PHYSX.PxConvexMeshDesc()
    desc.points.count = positions.length / 3
    desc.points.stride = 12
    desc.points.data = pointsPtr
    desc.flags.raise(PHYSX.PxConvexFlagEnum.eCOMPUTE_CONVEX)
    pmesh = PHYSX.CreateConvexMesh(cookingParams, desc)
  } else {
    desc = new PHYSX.PxTriangleMeshDesc()

    desc.points.count = positions.length / 3
    desc.points.stride = 12
    desc.points.data = pointsPtr

    let indices = index.array

    if (indices instanceof Uint8Array) {
      indices = new Uint16Array(index.array.length)
      for (let i = 0; i < index.array.length; i++) {
        indices[i] = index.array[i]
      }
    }

    const indexBytes = indices.length * indices.BYTES_PER_ELEMENT
    const indexPtr = PHYSX._webidl_malloc(indexBytes)
    if (indices instanceof Uint16Array) {
      PHYSX.HEAPU16.set(indices, indexPtr >> 1)
      desc.triangles.stride = 6
      desc.flags.raise(PHYSX.PxTriangleMeshFlagEnum.e16_BIT_INDICES)
    } else {
      PHYSX.HEAPU32.set(indices, indexPtr >> 2)
      desc.triangles.stride = 12
    }
    desc.triangles.count = indices.length / 3
    desc.triangles.data = indexPtr

    try {
      pmesh = PHYSX.CreateTriangleMesh(cookingParams, desc)
    } catch (err) {
      logger.error('Triangle mesh creation failed', { error: err.message })
    } finally {
      PHYSX._webidl_free(indexPtr)
    }
  }

  PHYSX._webidl_free(pointsPtr)
  PHYSX.destroy(desc)

  if (!pmesh) return null

  item = { id, pmesh, refs: 0 }
  cache.set(id, item)
  return new PMeshHandle(item)
}
