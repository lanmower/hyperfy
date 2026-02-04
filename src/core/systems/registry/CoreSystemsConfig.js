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
    platforms: ['server', 'client'],
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
    name: 'apps',
    class: Apps,
    platforms: ['server', 'client'],
    priority: 40,
  },
]
