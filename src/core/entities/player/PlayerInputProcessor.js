import { PlayerInputProcessorActions } from './PlayerInputProcessorActions.js'

export class PlayerInputProcessor {
  constructor(playerLocal) {
    this.playerLocal = playerLocal
    this.actions = new PlayerInputProcessorActions(playerLocal)
  }

  processCamera(delta) {
    this.actions.processCamera(delta)
  }

  processZoom(delta) {
    this.actions.processZoom(delta)
  }

  processJump() {
    this.actions.processJump()
  }

  processMovement(delta) {
    this.actions.processMovement(delta)
  }

  processStickActivation() {
    this.actions.processStickActivation()
  }

  processRunning() {
    this.actions.processRunning()
  }

  applyMovementRotation() {
    this.actions.applyMovementRotation()
  }

  getXRRotation() {
    return this.actions.getXRRotation()
  }

  applyBodyRotation(delta) {
    this.actions.applyBodyRotation(delta)
  }
}
