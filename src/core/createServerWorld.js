import { World } from './World.js'
import { Collections } from './systems/Collections.js'
import { Settings } from './systems/Settings.js'
import { BlueprintManager } from './systems/BlueprintManager.js'
import { Apps } from './systems/Apps.js'
import { Entities } from './systems/Entities.js'
import { Chat } from './systems/Chat.js'
import { ServerNetwork } from './systems/ServerNetwork.js'
import { ServerLiveKit } from './systems/ServerLiveKit.js'
import { Scripts } from './systems/Scripts.js'
import { UnifiedLoader } from './systems/UnifiedLoader.js'
import { Physics } from './systems/Physics.js'

export function createServerWorld() {
  const world = new World()
  world.isServer = true
  world.register('collections', Collections)
  world.register('settings', Settings)
  world.register('blueprints', BlueprintManager)
  world.register('apps', Apps)
  world.register('entities', Entities)
  world.register('chat', Chat)
  world.register('network', ServerNetwork)
  world.register('livekit', ServerLiveKit)
  world.register('scripts', Scripts)
  world.register('loader', UnifiedLoader)
  world.register('physics', Physics)
  return world
}
