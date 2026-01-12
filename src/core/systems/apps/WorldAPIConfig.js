import { WorldAPINetwork } from './WorldAPINetwork.js'
import { WorldAPIEvents } from './WorldAPIEvents.js'
import { WorldAPINodes } from './WorldAPINodes.js'
import { WorldAPITime } from './WorldAPITime.js'
import { WorldAPIPlayers } from './WorldAPIPlayers.js'
import { WorldAPIPhysics } from './WorldAPIPhysics.js'
import { WorldAPIStorage } from './WorldAPIStorage.js'
import { WorldAPINavigation } from './WorldAPINavigation.js'
import { WorldAPILoading } from './WorldAPILoading.js'

const modules = [
  WorldAPINetwork,
  WorldAPIEvents,
  WorldAPINodes,
  WorldAPITime,
  WorldAPIPlayers,
  WorldAPIPhysics,
  WorldAPIStorage,
  WorldAPINavigation,
  WorldAPILoading,
]

export const WorldAPIConfig = {
  getters: Object.assign({}, ...modules.map(m => m.getters)),
  setters: Object.assign({}, ...modules.map(m => m.setters)),
  methods: Object.assign({}, ...modules.map(m => m.methods)),
}
