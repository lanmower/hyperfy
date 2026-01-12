import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'

const b = new APIConfigBuilder('WorldAPIStorage')

b.addMethodDirect('get', (apps, entity, key) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'get' })
  return apps.world.storage?.get(key)
}, {
  module: 'WorldAPIConfig',
  method: 'get',
})

b.addMethodDirect('set', (apps, entity, key, value) => {
  ValidationHelper.assertIsString(key, 'key', { operation: 'set' })
  apps.world.storage?.set(key, value)
}, {
  module: 'WorldAPIConfig',
  method: 'set',
})

export const WorldAPIStorage = b.build()
