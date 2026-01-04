import { World } from './World.js'

import { ClientPrefs } from './systems/ClientPrefs.js'
import { InputSystem } from './systems/input/InputSystem.js'
import { ClientGraphics } from './systems/ClientGraphics.js'
import { ClientEnvironment } from './systems/ClientEnvironment.js'
import { ClientNetwork } from './systems/ClientNetwork.js'
import { ClientUI } from './systems/ClientUI.js'
import { ClientPointer } from './systems/ClientPointer.js'
import { Events } from './systems/Events.js'
import { Settings } from './systems/Settings.js'
import { Stage } from './systems/Stage.js'
import { Collections } from './systems/Collections.js'
import { Chat } from './systems/Chat.js'
import { UnifiedLoader } from './systems/UnifiedLoader.js'
import { BlueprintManager } from './systems/BlueprintManager.js'
import { Entities } from './systems/Entities.js'
import { ClientLiveKit } from './systems/ClientLiveKit.js'
import { Avatars } from './systems/Avatars.js'
import { PostProcessingController } from './systems/graphics/PostProcessingController.js'
import { CameraController } from './CameraController.js'
import { PlayerCapsuleRenderer } from './systems/PlayerCapsuleRenderer.js'
import { HUDOverlay } from './systems/HUDOverlay.js'
import { ClientActions } from './systems/ClientActions.js'
import { ClientAudio } from './systems/ClientAudio.js'
import { ClientStats } from './systems/ClientStats.js'
import { ClientAI } from './systems/ClientAI.js'
import { ClientTarget } from './systems/ClientTarget.js'
import { Particles } from './systems/Particles.js'
import { Nametags } from './systems/Nametags.js'
import { LODs } from './systems/LODs.js'
import { Wind } from './systems/Wind.js'
import { XR } from './systems/XR.js'
import { Snaps } from './systems/Snaps.js'
import { ClientBuilder } from './systems/ClientBuilder.js'
import { Animation } from './systems/Animation.js'
import { Scripts } from './systems/Scripts.js'
import { Anchors } from './systems/Anchors.js'
import { Apps } from './systems/Apps.js'
import { Physics } from './systems/Physics.js'

export function createClientWorld() {
  console.log('[CREATE_CLIENT_WORLD] Starting world creation with all systems')
  const world = new World()
  world.isClient = true
  world.isServer = false
  world.register('settings', Settings)
  world.register('collections', Collections)
  world.register('events', Events)
  world.register('chat', Chat)
  world.register('loader', UnifiedLoader)
  world.register('blueprints', BlueprintManager)
  world.register('entities', Entities)
  world.register('avatars', Avatars)
  world.register('graphics', ClientGraphics)
  world.register('stage', Stage)
  world.register('prefs', ClientPrefs)
  world.register('environment', ClientEnvironment)
  world.register('postProcessing', PostProcessingController)
  world.register('livekit', ClientLiveKit)
  world.register('controls', InputSystem)
  world.register('cameraController', CameraController)
  world.register('playerCapsuleRenderer', PlayerCapsuleRenderer)
  world.register('hud', HUDOverlay)
  world.register('ui', ClientUI)
  world.register('pointer', ClientPointer)
  world.register('network', ClientNetwork)
  world.register('actions', ClientActions)
  world.register('audio', ClientAudio)
  world.register('stats', ClientStats)
  world.register('ai', ClientAI)
  world.register('target', ClientTarget)
  world.register('particles', Particles)
  world.register('nametags', Nametags)
  world.register('lods', LODs)
  world.register('wind', Wind)
  world.register('xr', XR)
  world.register('snaps', Snaps)
  world.register('builder', ClientBuilder)
  world.register('animation', Animation)
  world.register('scripts', Scripts)
  world.register('anchors', Anchors)
  world.register('apps', Apps)
  world.register('physics', Physics)
  return world
}
