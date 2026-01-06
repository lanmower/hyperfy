import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import { SYSTEM_INTERNAL_EVENTS } from '../../utils/events/EventConstants.js'
import { HyperfyError } from '../../utils/errors/HyperfyError.js'

const b = new APIConfigBuilder('AppAPIConfig')

b.addMethod('on', (apps, entity, name, callback) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'on' })
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'on' })
  entity.on(name, callback)
})

b.addMethod('off', (apps, entity, name, callback) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'off' })
  ValidationHelper.assertNotNull(callback, 'callback', { operation: 'off' })
  entity.off(name, callback)
})

b.addMethod('send', (apps, entity, name, data, ignoreSocketId) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'send' })

  const internalEvents = SYSTEM_INTERNAL_EVENTS
  if (internalEvents.includes(name)) {
    throw new HyperfyError('PERMISSION_DENIED', `apps cannot send internal events (${name})`, {
      eventName: name,
      operation: 'send',
    })
  }

  if (!apps?.world?.network) {
    throw new HyperfyError('INVALID_STATE', 'Network system not available', { operation: 'send' })
  }

  const event = [entity.data.id, entity.blueprint?.version, name, data]
  apps.world.network.send('entityEvent', event, ignoreSocketId)
})

b.addMethod('sendTo', (apps, entity, playerId, name, data) => {
  ValidationHelper.assertIsString(name, 'name', { operation: 'sendTo' })
  ValidationHelper.assertIsString(playerId, 'playerId', { operation: 'sendTo' })

  if (!apps?.world?.network?.isServer) {
    throw new HyperfyError('PERMISSION_DENIED', 'sendTo can only be called on the server', {
      operation: 'sendTo',
    })
  }

  const internalEvents = SYSTEM_INTERNAL_EVENTS
  if (internalEvents.includes(name)) {
    throw new HyperfyError('PERMISSION_DENIED', `apps cannot send internal events (${name})`, {
      eventName: name,
      operation: 'sendTo',
    })
  }

  const player = apps.world.entities.get(playerId)
  if (!player) {
    return
  }

  const event = [entity.data.id, entity.blueprint?.version, name, data]
  apps.world.network.sendTo(playerId, 'entityEvent', event)
})

b.addMethod('emit', (apps, entity, name, data) => {
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
})

export { b as eventsBuilder }
