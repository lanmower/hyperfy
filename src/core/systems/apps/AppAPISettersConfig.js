import { isArray } from '../../utils/helpers/typeChecks.js'
import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { ControlPriorities } from '../../extras/ControlPriorities.js'
import { HyperfyError } from '../../utils/errors/HyperfyError.js'
import { FILE_TYPES } from './FieldTypeConstants.js'

const fileRemaps = Object.fromEntries(FILE_TYPES.map(type => [
  type,
  field => { field.type = 'file'; field.kind = type }
]))

const b = new APIConfigBuilder('AppAPIConfig')

b.addSetter('state', (apps, entity, value) => {
  ValidationHelper.assertIsObject(value, 'state', { operation: 'set state' })
  entity.data.state = value
})

b.addSetter('keepActive', (apps, entity, value) => {
  if (typeof value !== 'boolean') {
    return
  }
  entity.keepActive = value
})

b.addMethod('configure', (apps, entity, fields) => {
  if (!isArray(fields)) {
    entity.fields = []
  } else {
    entity.fields = fields
  }

  if (!entity.blueprint) {
    return
  }

  const props = entity.blueprint.props
  for (const field of entity.fields) {
    if (!field || typeof field !== 'object') {
      continue
    }
    fileRemaps[field.type]?.(field)
    if (field.initial !== undefined && props[field.key] === undefined) {
      props[field.key] = field.initial
    }
  }
  entity.onFields?.(entity.fields)
})

b.addMethod('control', (apps, entity, options) => {
  ValidationHelper.assertIsObject(options, 'options', { operation: 'control' })

  if (!apps?.world?.controls) {
    throw new HyperfyError('INVALID_STATE', 'Controls system not available', { operation: 'control' })
  }

  entity.control?.release()
  entity.control = apps.world.controls.bind({
    ...options,
    priority: ControlPriorities.APP,
    object: entity,
  })
  return entity.control
})

b.addMethodDirect('get', (apps, entity, key) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'get' })
  return entity.data.state?.[key]
}, {
  module: 'AppAPIConfig',
  method: 'get',
})

b.addMethodDirect('set', (apps, entity, key, value) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'set' })
  if (!entity.data.state) entity.data.state = {}
  entity.data.state[key] = value
}, {
  module: 'AppAPIConfig',
  method: 'set',
})

export { b as settersBuilder }
