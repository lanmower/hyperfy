import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { SYSTEM_INTERNAL_EVENTS } from '../../utils/events/EventConstants.js'

const b = new APIConfigBuilder('WorldAPIEvents')

b.addMethodDirect('on', (apps, entity, name, callback) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'on', eventName: name })
  ValidationHelper.assertIsString(name, 'name', { operation: 'on' })
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'on' })
  entity.onWorldEvent(name, callback)
}, {
  module: 'WorldAPIConfig',
  method: 'on',
})

b.addMethodDirect('off', (apps, entity, name, callback) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'off', eventName: name })
  ValidationHelper.assertIsString(name, 'name', { operation: 'off' })
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'off' })
  entity.offWorldEvent(name, callback)
}, {
  module: 'WorldAPIConfig',
  method: 'off',
})

b.addMethodDirect('emit', (apps, entity, name, data) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'emit', eventName: name })
  ValidationHelper.assertIsString(name, 'name', { operation: 'emit' })

  const internalEvents = SYSTEM_INTERNAL_EVENTS
  if (internalEvents.includes(name)) {
    throw new HyperfyError('PERMISSION_DENIED', `apps cannot emit internal events (${name})`, {
      eventName: name,
      operation: 'emit',
    })
  }

  if (!apps?.world?.events) {
    throw new HyperfyError('INVALID_STATE', 'Events system not available', { operation: 'emit' })
  }

  apps.world.events.emit(name, data)
}, {
  module: 'WorldAPIConfig',
  method: 'emit',
})

export const WorldAPIEvents = b.build()
