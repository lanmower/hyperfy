import { Anchors } from '../Anchors.js'
import { Apps } from '../Apps.js'
import { Avatars } from '../Avatars.js'
import { BlueprintManager } from '../BlueprintManager.js'
import { CameraController } from '../../CameraController.js'
import { Chat } from '../Chat.js'
import { ClientBuilder } from '../ClientBuilder.js'
import { InputSystem } from '../input/InputSystem.js'
import { ClientEnvironment } from '../ClientEnvironment.js'
import { ClientGraphics } from '../ClientGraphics.js'
import { UnifiedLoader } from '../UnifiedLoader.js'
import { ClientNetwork } from '../ClientNetwork.js'
import { ClientPrefs } from '../ClientPrefs.js'
import { ClientUI } from '../ClientUI.js'
import { Collections } from '../Collections.js'
import { Entities } from '../Entities.js'
import { ErrorSystem } from '../ErrorSystem.js'
import { Events } from '../Events.js'
import { Physics } from '../Physics.js'
import { Scripts } from '../Scripts.js'
import { Settings } from '../Settings.js'
import { Stage } from '../Stage.js'
import { ClientLiveKit } from '../ClientLiveKit.js'

export const coreSystemsConfig = [
  {
    name: 'errors',
    class: ErrorSystem,
    platforms: ['server', 'client'],
    priority: 1000,
    required: true,
  },
  {
    name: 'settings',
    class: Settings,
    platforms: ['server', 'client'],
    priority: 90,
    required: true,
  },
  {
    name: 'prefs',
    class: ClientPrefs,
    platforms: ['client'],
    priority: 85,
  },
  {
    name: 'collections',
    class: Collections,
    platforms: ['server', 'client'],
    priority: 80,
  },
  {
    name: 'scripts',
    class: Scripts,
    platforms: ['server', 'client'],
    priority: 75,
  },
  {
    name: 'events',
    class: Events,
    platforms: ['server', 'client'],
    priority: 70,
    required: true,
  },
  {
    name: 'chat',
    class: Chat,
    platforms: ['server', 'client'],
    priority: 65,
  },
  {
    name: 'loader',
    class: UnifiedLoader,
    platforms: ['client'],
    priority: 62,
  },
  {
    name: 'blueprints',
    class: BlueprintManager,
    platforms: ['server', 'client'],
    priority: 60,
  },
  {
    name: 'physics',
    class: Physics,
    platforms: ['server', 'client'],
    priority: 50,
  },
  {
    name: 'entities',
    class: Entities,
    platforms: ['server', 'client'],
    priority: 48,
    required: true,
  },
  {
    name: 'network',
    class: ClientNetwork,
    platforms: ['client'],
    priority: 45,
    required: true,
  },
  {
    name: 'apps',
    class: Apps,
    platforms: ['server', 'client'],
    priority: 40,
  },
  {
    name: 'anchors',
    class: Anchors,
    platforms: ['server', 'client'],
    priority: 35,
  },
  {
    name: 'avatars',
    class: Avatars,
    platforms: ['server', 'client'],
    priority: 30,
  },
  {
    name: 'stage',
    class: Stage,
    platforms: ['client'],
    priority: 25,
  },
  {
    name: 'environment',
    class: ClientEnvironment,
    platforms: ['client'],
    priority: 26,
  },
  {
    name: 'graphics',
    class: ClientGraphics,
    platforms: ['client'],
    priority: 23,
  },
  {
    name: 'livekit',
    class: ClientLiveKit,
    platforms: ['client'],
    priority: 22,
  },
  {
    name: 'controls',
    class: InputSystem,
    platforms: ['client'],
    priority: 21,
  },
  {
    name: 'cameraController',
    class: CameraController,
    platforms: ['client'],
    priority: 20.5,
  },
  {
    name: 'builder',
    class: ClientBuilder,
    platforms: ['client'],
    priority: 20,
  },
  {
    name: 'ui',
    class: ClientUI,
    platforms: ['client'],
    priority: 19,
  },
]
