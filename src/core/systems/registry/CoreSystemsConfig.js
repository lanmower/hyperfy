import { Apps } from '../Apps.js'
import { BlueprintManager } from '../BlueprintManager.js'
import { Chat } from '../Chat.js'
import { Collections } from '../Collections.js'
import { Entities } from '../Entities.js'
import { ErrorSystem } from '../ErrorSystem.js'
import { Events } from '../Events.js'
import { Physics } from '../Physics.js'
import { Scripts } from '../Scripts.js'
import { Settings } from '../Settings.js'
import { UnifiedLoader } from '../UnifiedLoader.js'
import { ServerLiveKit } from '../ServerLiveKit.js'

export const coreSystemsConfig = [
  {
    name: 'errors',
    class: ErrorSystem,
    platforms: ['server'],
    priority: 1000,
    required: true,
  },
  {
    name: 'settings',
    class: Settings,
    platforms: ['server'],
    priority: 90,
    required: true,
  },
  {
    name: 'collections',
    class: Collections,
    platforms: ['server'],
    priority: 80,
  },
  {
    name: 'events',
    class: Events,
    platforms: ['server'],
    priority: 70,
    required: true,
  },
  {
    name: 'loader',
    class: UnifiedLoader,
    platforms: ['server'],
    priority: 62,
  },
  {
    name: 'blueprints',
    class: BlueprintManager,
    platforms: ['server'],
    priority: 60,
  },
  {
    name: 'physics',
    class: Physics,
    platforms: ['server'],
    priority: 50,
  },
  {
    name: 'entities',
    class: Entities,
    platforms: ['server'],
    priority: 48,
    required: true,
  },
  {
    name: 'chat',
    class: Chat,
    platforms: ['server'],
    priority: 65,
  },
  {
    name: 'apps',
    class: Apps,
    platforms: ['server'],
    priority: 40,
  },
  {
    name: 'scripts',
    class: Scripts,
    platforms: ['server'],
    priority: 75,
  },
  {
    name: 'livekit',
    class: ServerLiveKit,
    platforms: ['server'],
    priority: 55,
  },
]
