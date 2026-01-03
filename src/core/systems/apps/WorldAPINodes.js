import * as THREE from '../../extras/three.js'
import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { getRef } from '../../nodes/NodeProxy.js'

const b = new APIConfigBuilder('WorldAPINodes')

b.addGetterDirect('props', (apps, entity) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'get props' })
  return entity.blueprint?.props || {}
}, {
  defaultReturn: {},
})

b.addMethodDirect('add', (apps, entity, pNode) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'add' })
  ValidationHelper.assertNotNull(pNode, 'node', { operation: 'add' })

  const node = getRef(pNode)
  if (!node) {
    throw new HyperfyError('NULL_REFERENCE', 'Node reference is null', { operation: 'add' })
  }

  if (node.parent) {
    node.parent.remove(node)
  }
  entity.worldNodes.add(node)
  node.activate({ world: apps.world, entity })
}, {
  module: 'WorldAPIConfig',
  method: 'add',
})

b.addMethodDirect('remove', (apps, entity, pNode) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'remove' })
  ValidationHelper.assertNotNull(pNode, 'node', { operation: 'remove' })

  const node = getRef(pNode)
  if (!node) return

  if (node.parent) return
  if (!entity.worldNodes.has(node)) return

  entity.worldNodes.delete(node)
  node.deactivate()
}, {
  module: 'WorldAPIConfig',
  method: 'remove',
})

b.addMethodDirect('attach', (apps, entity, pNode) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'attach' })
  ValidationHelper.assertNotNull(pNode, 'node', { operation: 'attach' })

  const node = getRef(pNode)
  if (!node) {
    throw new HyperfyError('NULL_REFERENCE', 'Node reference is null', { operation: 'attach' })
  }

  const parent = node.parent
  if (!parent) {
    throw new HyperfyError('INVALID_STATE', 'Node has no parent to attach from', { operation: 'attach' })
  }

  const finalMatrix = new THREE.Matrix4()
  finalMatrix.copy(node.matrix)
  let currentParent = node.parent
  while (currentParent) {
    finalMatrix.premultiply(currentParent.matrix)
    currentParent = currentParent.parent
  }
  parent.remove(node)
  finalMatrix.decompose(node.position, node.quaternion, node.scale)
  node.activate({ world: apps.world, entity })
  entity.worldNodes.add(node)
}, {
  module: 'WorldAPIConfig',
  method: 'attach',
})

export const WorldAPINodes = b.build()
