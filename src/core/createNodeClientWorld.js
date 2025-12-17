import { World } from './World.js'

import { NodeClient } from './systems/NodeClient.js'
import { ClientControls } from './systems/ClientControls.js'
import { ClientNetwork } from './systems/ClientNetwork.js'
import { ServerLoader } from './systems/ServerLoader.js'
import { NodeEnvironment } from './systems/NodeEnvironment.js'

export function createNodeClientWorld() {
  const world = new World()
  world.register('client', NodeClient)
  world.register('controls', ClientControls)
  world.register('network', ClientNetwork)
  world.register('loader', ServerLoader) // TODO: ClientLoader should be named BrowserLoader and ServerLoader should be called NodeLoader
  world.register('environment', NodeEnvironment)
  return world
}
