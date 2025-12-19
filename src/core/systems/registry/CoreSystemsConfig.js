import { ErrorMonitor } from '../ErrorMonitor.js'
import { Settings } from '../Settings.js'
import { Collections } from '../Collections.js'
import { Apps } from '../Apps.js'
import { Anchors } from '../Anchors.js'
import { Avatars } from '../Avatars.js'
import { Events } from '../Events.js'
import { Chat } from '../Chat.js'
import { Scripts } from '../Scripts.js'
import { Blueprints } from '../Blueprints.js'
import { Entities } from '../Entities.js'
import { Physics } from '../Physics.js'
import { Stage } from '../Stage.js'

export const coreSystemsConfig = [
  {
    name: 'errorMonitor',
    class: ErrorMonitor,
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
    name: 'blueprints',
    class: Blueprints,
    platforms: ['server', 'client'],
    priority: 60,
  },
  {
    name: 'entities',
    class: Entities,
    platforms: ['server', 'client'],
    priority: 50,
    required: true,
  },
  {
    name: 'apps',
    class: Apps,
    platforms: ['server', 'client'],
    priority: 45,
  },
  {
    name: 'anchors',
    class: Anchors,
    platforms: ['server', 'client'],
    priority: 40,
  },
  {
    name: 'avatars',
    class: Avatars,
    platforms: ['server', 'client'],
    priority: 35,
  },
  {
    name: 'physics',
    class: Physics,
    platforms: ['server', 'client'],
    priority: 30,
  },
  {
    name: 'stage',
    class: Stage,
    platforms: ['client'],
    priority: 25,
  },
]
