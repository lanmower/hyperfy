import * as THREE from '../../extras/three.js'
import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { Layers } from '../../extras/Layers.js'

const b = new APIConfigBuilder('WorldAPIPhysics')

b.addMethodDirect('createLayerMask', (apps, entity, ...groups) => {
  let mask = 0
  for (const group of groups) {
    if (!Layers[group]) {
      throw new HyperfyError('INPUT_VALIDATION', `Invalid layer group: ${group}`, {
        operation: 'createLayerMask',
        group,
      })
    }
    mask |= Layers[group].group
  }
  return mask
}, {
  module: 'WorldAPIConfig',
  method: 'createLayerMask',
  defaultReturn: 0,
})

b.addMethodDirect('raycast', (apps, entity, origin, direction, maxDistance, layerMask) => {
  ValidationHelper.assertIsVector3(origin, 'origin', { operation: 'raycast' })
  ValidationHelper.assertIsVector3(direction, 'direction', { operation: 'raycast' })

  if (maxDistance !== undefined && maxDistance !== null) {
    ValidationHelper.assertIsNumber(maxDistance, 'maxDistance', { operation: 'raycast' })
  }

  if (layerMask !== undefined && layerMask !== null) {
    ValidationHelper.assertIsNumber(layerMask, 'layerMask', { operation: 'raycast' })
  }

  if (!apps?.world?.physics) {
    throw new HyperfyError('INVALID_STATE', 'Physics system not available', { operation: 'raycast' })
  }

  const hit = apps.world.physics.raycast(origin, direction, maxDistance, layerMask)
  if (!hit) return null

  if (!apps.raycastHit) {
    apps.raycastHit = {
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      distance: 0,
      tag: null,
      playerId: null,
    }
  }

  apps.raycastHit.point.copy(hit.point)
  apps.raycastHit.normal.copy(hit.normal)
  apps.raycastHit.distance = hit.distance
  apps.raycastHit.tag = hit.handle?.tag
  apps.raycastHit.playerId = hit.handle?.playerId
  return apps.raycastHit
}, {
  module: 'WorldAPIConfig',
  method: 'raycast',
})

b.addMethodDirect('overlapSphere', (apps, entity, radius, origin, layerMask) => {
  ValidationHelper.assertIsNumber(radius, 'radius', { operation: 'overlapSphere' })
  ValidationHelper.assertIsVector3(origin, 'origin', { operation: 'overlapSphere' })

  if (layerMask !== undefined && layerMask !== null) {
    ValidationHelper.assertIsNumber(layerMask, 'layerMask', { operation: 'overlapSphere' })
  }

  if (!apps?.world?.physics) {
    throw new HyperfyError('INVALID_STATE', 'Physics system not available', { operation: 'overlapSphere' })
  }

  const hits = apps.world.physics.overlapSphere(radius, origin, layerMask)
  return hits.map(hit => hit.proxy)
}, {
  module: 'WorldAPIConfig',
  method: 'overlapSphere',
  defaultReturn: [],
})

export const WorldAPIPhysics = b.build()
