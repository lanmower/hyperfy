// Pre-initialize client systems for synchronous access via top-level await

import { getSystemsAsync } from './SystemFactory.js'

const systems = await getSystemsAsync()

export const clientSystems = systems.clientSystems
