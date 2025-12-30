import { Client } from '../systems/Client.js'
import { UnifiedLoader } from '../systems/UnifiedLoader.js'
import { ClientPrefs } from '../systems/ClientPrefs.js'
import { InputSystem } from '../systems/input/InputSystem.js'
import { ClientGraphics } from '../systems/ClientGraphics.js'
import { ClientEnvironment } from '../systems/ClientEnvironment.js'
import { NodeClient } from '../systems/NodeClient.js'
import { ClientNetwork } from '../systems/ClientNetwork.js'
import { NodeEnvironment } from '../systems/NodeEnvironment.js'

export const VIEWER_PLATFORM = {
  systems: [
    { name: 'client', class: Client, priority: 90 },
    { name: 'prefs', class: ClientPrefs, priority: 85 },
    { name: 'loader', class: UnifiedLoader, priority: 80 },
    { name: 'controls', class: InputSystem, priority: 75 },
    { name: 'graphics', class: ClientGraphics, priority: 65 },
    { name: 'environment', class: ClientEnvironment, priority: 60 }
  ]
}

export const NODE_CLIENT_PLATFORM = {
  systems: [
    { name: 'client', class: NodeClient, priority: 90 },
    { name: 'controls', class: InputSystem, priority: 80 },
    { name: 'network', class: ClientNetwork, priority: 75 },
    { name: 'loader', class: UnifiedLoader, priority: 70 },
    { name: 'environment', class: NodeEnvironment, priority: 65 }
  ]
}
