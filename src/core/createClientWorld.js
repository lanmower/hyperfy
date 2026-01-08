import { World } from './World.js'

import { Client } from './systems/Client.js'
import { ClientLiveKit } from './systems/ClientLiveKit.js'
import { ClientPointer } from './systems/ClientPointer.js'
import { ClientPrefs } from './systems/ClientPrefs.js'
import { InputSystem } from './systems/input/InputSystem.js'
import { ClientNetwork } from './systems/ClientNetwork.js'
import { Scripts } from './systems/Scripts.js'
import { Apps } from './systems/Apps.js'
import { UnifiedLoader } from './systems/UnifiedLoader.js'
import { ClientGraphics } from './systems/ClientGraphics.js'
import { ClientEnvironment } from './systems/ClientEnvironment.js'
import { ClientAudio } from './systems/ClientAudio.js'
import { ClientStats } from './systems/ClientStats.js'
import { ClientBuilder } from './systems/ClientBuilder.js'
import { ClientActions } from './systems/ClientActions.js'
import { ClientTarget } from './systems/ClientTarget.js'
import { ClientUI } from './systems/ClientUI.js'
import { LODs } from './systems/LODs.js'
import { Nametags } from './systems/Nametags.js'
import { Particles } from './systems/Particles.js'
import { Snaps } from './systems/Snaps.js'
import { Wind } from './systems/Wind.js'
import { XR } from './systems/XR.js'
import { ClientAI } from './systems/ClientAI.js'
import { Collections } from './systems/Collections.js'
import { Settings } from './systems/Settings.js'
import { BlueprintManager } from './systems/BlueprintManager.js'
import { Entities } from './systems/Entities.js'
import { Chat } from './systems/Chat.js'
import { Events } from './systems/Events.js'
import { Stage } from './systems/Stage.js'
import { Physics } from './systems/Physics.js'
import { Avatars } from './systems/Avatars.js'
import { HUDOverlay } from './systems/HUDOverlay.js'

export function createClientWorld() {
  const world = new World()
  world.register('client', Client)
  world.register('livekit', ClientLiveKit)
  world.register('pointer', ClientPointer)
  world.register('prefs', ClientPrefs)
  world.register('controls', InputSystem)
  world.register('events', Events)
  world.register('settings', Settings)
  world.register('collections', Collections)
  world.register('scripts', Scripts)
  world.register('apps', Apps)
  world.register('loader', UnifiedLoader)
  world.register('blueprints', BlueprintManager)
  world.register('entities', Entities)
  world.register('avatars', Avatars)
  world.register('chat', Chat)
  world.register('network', ClientNetwork)
  world.register('graphics', ClientGraphics)
  world.register('stage', Stage)
  world.register('physics', Physics)
  world.register('environment', ClientEnvironment)
  world.register('audio', ClientAudio)
  world.register('stats', ClientStats)
  world.register('builder', ClientBuilder)
  world.register('actions', ClientActions)
  world.register('target', ClientTarget)
  world.register('ui', ClientUI)
  world.register('lods', LODs)
  world.register('nametags', Nametags)
  world.register('particles', Particles)
  world.register('snaps', Snaps)
  world.register('wind', Wind)
  world.register('xr', XR)
  world.register('ai', ClientAI)
  world.register('hud', HUDOverlay)
  return world
}
