import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { HyperfyError } from '../../utils/errors/HyperfyError.js'

const b = new APIConfigBuilder('AppAPIConfig')

b.addMethod('create', (apps, entity, name, data) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'create' })

  if (!entity.createNode || typeof entity.createNode !== 'function') {
    throw new HyperfyError('INVALID_STATE', 'Entity does not support createNode', {
      operation: 'create',
      nodeName: name,
    })
  }

  const node = entity.createNode(name, data)
  if (!node) {
    throw new HyperfyError('NULL_REFERENCE', `Failed to create node: ${name}`, {
      operation: 'create',
      nodeName: name,
    })
  }
  return typeof node.getProxy === 'function' ? node.getProxy() : node
})

b.addMethod('add', (apps, entity, node) => {
  ValidationHelper.assertNotNull(node, 'node', { operation: 'add' })

  if (!entity.root) {
    throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'add' })
  }

  const ref = node.ref || node
  if (!ref) {
    throw new HyperfyError('NULL_REFERENCE', 'Node reference is null', { operation: 'add' })
  }

  if (ref.parent) ref.parent.remove(ref)
  entity.root.add(ref)
  ref.mount?.()
  ref.activate?.({ world: apps.world, entity })
})

b.addMethod('remove', (apps, entity, node) => {
  ValidationHelper.assertNotNull(node, 'node', { operation: 'remove' })

  if (!entity.root) {
    throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'remove' })
  }

  const ref = node.ref || node
  if (ref && ref.parent === entity.root) {
    entity.root.remove(ref)
  }
  ref?.deactivate?.()
})

b.addMethod('traverse', (apps, entity, callback) => {
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'traverse' })

  if (!entity.root) {
    throw new HyperfyError('INVALID_STATE', 'Entity root not initialized', { operation: 'traverse' })
  }

  entity.root.traverse(callback)
})

b.addMethod('clean', (apps, entity) => {
  if (!entity.root) {
    return
  }

  entity.root.clean?.()
})

export { b as nodeBuilder }
