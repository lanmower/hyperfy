import { APIConfigBuilder } from '../../utils/api/index.js'

const b = new APIConfigBuilder('WorldAPINetwork')

b.addGetterDirect('networkId', (apps, entity) => {
  if (!apps?.world?.network) {
    throw new HyperfyError('INVALID_STATE', 'Network system not available')
  }
  return apps.world.network.id
})

b.addGetterDirect('isServer', (apps, entity) => apps?.world?.network?.isServer || false, {
  defaultReturn: false,
})

b.addGetterDirect('isClient', (apps, entity) => apps?.world?.network?.isClient || false, {
  defaultReturn: false,
})

export const WorldAPINetwork = b.build()
