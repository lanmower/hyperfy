import { APIConfigBuilder } from '../../utils/api/index.js'
import { ValidationHelper } from '../../utils/api/ValidationHelper.js'

const b = new APIConfigBuilder('WorldAPIPlayers')

b.addMethodDirect('getPlayer', (apps, entity, playerId) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'getPlayer' })
  ValidationHelper.assertIsString(playerId, 'playerId', { operation: 'getPlayer' })
  return entity.getPlayerProxy(playerId)
}, {
  module: 'WorldAPIConfig',
  method: 'getPlayer',
})

b.addMethodDirect('getPlayers', (apps, entity) => {
  ValidationHelper.assertEntityValid(entity, { operation: 'getPlayers' })

  const players = []
  apps.world.entities.players.forEach(player => {
    players.push(entity.getPlayerProxy(player.data.id))
  })
  return players
}, {
  module: 'WorldAPIConfig',
  method: 'getPlayers',
  defaultReturn: [],
})

export const WorldAPIPlayers = b.build()
