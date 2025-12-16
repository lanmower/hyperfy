// System factory - unifies system registration across worlds

import { Server } from './systems/Server.js'
import { ServerLiveKit } from './systems/ServerLiveKit.js'
import { ServerNetwork } from './systems/ServerNetwork.js'
import { ServerLoader } from './systems/ServerLoader.js'
import { ServerEnvironment } from './systems/ServerEnvironment.js'
import { ServerMonitor } from './systems/ServerMonitor.js'
import { Client } from './systems/Client.js'
import { ClientLiveKit } from './systems/ClientLiveKit.js'
import { ClientPointer } from './systems/ClientPointer.js'
import { ClientPrefs } from './systems/ClientPrefs.js'
import { ClientControls } from './systems/ClientControls.js'
import { ClientNetwork } from './systems/ClientNetwork.js'
import { ClientLoader } from './systems/ClientLoader.js'
import { ClientGraphics } from './systems/ClientGraphics.js'
import { ClientEnvironment } from './systems/ClientEnvironment.js'
import { ClientAudio } from './systems/ClientAudio.js'
import { ClientStats } from './systems/ClientStats.js'
import { ClientBuilder } from './systems/ClientBuilder.js'
import { ClientActions } from './systems/ClientActions.js'
import { ClientTarget } from './systems/ClientTarget.js'
import { ClientUI } from './systems/ClientUI.js'
import { LODs } from './systems/LODs.js'
import { Nametags } from './systems/Nametags.js'
import { Particles } from './systems/Particles.js'
import { Snaps } from './systems/Snaps.js'
import { Wind } from './systems/Wind.js'
import { XR } from './systems/XR.js'
import { ErrorMonitor } from './systems/ErrorMonitor.js'

const serverSystems = {
  server: Server,
  livekit: ServerLiveKit,
  network: ServerNetwork,
  loader: ServerLoader,
  environment: ServerEnvironment,
  monitor: ServerMonitor,
  errorMonitor: ErrorMonitor,
}

const clientSystems = {
  client: Client,
  livekit: ClientLiveKit,
  pointer: ClientPointer,
  prefs: ClientPrefs,
  controls: ClientControls,
  network: ClientNetwork,
  loader: ClientLoader,
  graphics: ClientGraphics,
  environment: ClientEnvironment,
  audio: ClientAudio,
  stats: ClientStats,
  builder: ClientBuilder,
  actions: ClientActions,
  target: ClientTarget,
  ui: ClientUI,
  lods: LODs,
  nametags: Nametags,
  particles: Particles,
  snaps: Snaps,
  wind: Wind,
  xr: XR,
  errorMonitor: ErrorMonitor,
}

export { serverSystems, clientSystems }
