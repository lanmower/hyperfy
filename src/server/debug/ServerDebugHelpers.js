import { ServerDebugCommands } from './ServerDebugCommands.js'
import { ServerDebugInspection } from './ServerDebugInspection.js'

export const ServerDebugHelpers = {
  ...ServerDebugCommands,
  ...ServerDebugInspection,
}
