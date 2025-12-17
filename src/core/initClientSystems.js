
import { getSystemsAsync } from './SystemFactory.js'

const systems = await getSystemsAsync()

export const clientSystems = systems.clientSystems
