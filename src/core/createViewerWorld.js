import { World } from './World.js'

import { Client } from './systems/Client.js'
import { ClientPrefs } from './systems/ClientPrefs.js'
import { ClientLoader } from './systems/ClientLoader.js'
import { ClientControls } from './systems/ClientControls.js'
import { ClientGraphics } from './systems/ClientGraphics.js'
import { ClientEnvironment } from './systems/ClientEnvironment.js'

export { System } from './systems/System.js'

export function createViewerWorld() {
  const world = new World()
  world.register('client', Client)
  world.register('prefs', ClientPrefs)
  world.register('loader', ClientLoader)
  world.register('controls', ClientControls)
  world.register('graphics', ClientGraphics)
  world.register('environment', ClientEnvironment)
  return world
}
