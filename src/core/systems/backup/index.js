export { StateBackup } from './StateBackup.js'
export { StateRecovery } from './StateRecovery.js'

let stateBackup = null
let stateRecovery = null

export function initializeBackupSystem(world) {
  stateBackup = new StateBackup(world)
  stateRecovery = new StateRecovery(world)
  return { stateBackup, stateRecovery }
}

export function getStateBackup() {
  return stateBackup
}

export function getStateRecovery() {
  return stateRecovery
}
