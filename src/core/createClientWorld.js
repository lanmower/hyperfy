import { World } from './World.js'

import { ClientPrefs } from './systems/ClientPrefs.js'
import { InputSystem } from './systems/input/InputSystem.js'
import { ClientGraphics } from './systems/ClientGraphics.js'
import { ClientEnvironment } from './systems/ClientEnvironment.js'
import { ClientNetwork } from './systems/ClientNetwork.js'
import { ClientUI } from './systems/ClientUI.js'
import { Events } from './systems/Events.js'
import { Settings } from './systems/Settings.js'
import { Stage } from './systems/Stage.js'
import { Collections } from './systems/Collections.js'
import { Chat } from './systems/Chat.js'
import { UnifiedLoader } from './systems/UnifiedLoader.js'
import { BlueprintManager } from './systems/BlueprintManager.js'
import { Entities } from './systems/Entities.js'
import { ClientLiveKit } from './systems/ClientLiveKit.js'

export function createClientWorld() {
  const world = new World()
  world.register('settings', Settings)
  world.register('collections', Collections)
  world.register('events', Events)
  world.register('chat', Chat)
  world.register('loader', UnifiedLoader)
  world.register('blueprints', BlueprintManager)
  world.register('entities', Entities)
  world.register('stage', Stage)
  world.register('prefs', ClientPrefs)
  world.register('environment', ClientEnvironment)
  world.register('graphics', ClientGraphics)
  world.register('livekit', ClientLiveKit)
  world.register('controls', InputSystem)
  world.register('ui', ClientUI)
  world.register('network', ClientNetwork)
  return world
}
