import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'
import moment from 'moment'

const b = new APIConfigBuilder('WorldAPITime')

b.addMethodDirect('getTime', (apps, entity) => {
  if (!apps?.world?.network) {
    throw new HyperfyError('INVALID_STATE', 'Network system not available', { operation: 'getTime' })
  }
  return apps.world.network.getTime()
}, {
  module: 'WorldAPIConfig',
  method: 'getTime',
  defaultReturn: Date.now,
})

b.addMethodDirect('getTimestamp', (apps, entity, format) => {
  if (!format) return moment().toISOString()
  return moment().format(format)
}, {
  module: 'WorldAPIConfig',
  method: 'getTimestamp',
  defaultReturn: moment().toISOString,
})

b.addMethodDirect('chat', (apps, entity, msg, broadcast) => {
  ValidationHelper.assertNotNull(msg, 'msg', { operation: 'chat' })
  if (!apps?.world?.chat) {
    throw new HyperfyError('INVALID_STATE', 'Chat system not available', { operation: 'chat' })
  }
  apps.world.chat.add(msg, broadcast)
}, {
  module: 'WorldAPIConfig',
  method: 'chat',
})

export const WorldAPITime = b.build()
