/* Unified player management coordinator consolidating avatar, camera, UI, and transform sync */

import * as pc from '../../extras/playcanvas.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { DEG2RAD } from '../../extras/general.js'
import { DEFAULT_CAM_HEIGHT, POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from "./CameraConstants.js"
import { InputConfig } from "../../config/SystemConfig.js"
import { PlayerControllerInput } from './PlayerControllerInput.js'
import { PlayerControllerMovement } from './PlayerControllerMovement.js'

const logger = new StructuredLogger('PlayerController')

export class PlayerController {
  constructor(player) {
    this.player = player
    this.input = new PlayerControllerInput(this)
    this.movement = new PlayerControllerMovement(player)
    this.initCamera()
  }

  initCamera() {
    this.camHeight = DEFAULT_CAM_HEIGHT
    this.position = new pc.Vec3(
      this.player.data.position[0],
      this.player.data.position[1] + this.camHeight,
      this.player.data.position[2]
    )
    this.quaternion = new pc.Quat(
      this.player.data.quaternion[0],
      this.player.data.quaternion[1],
      this.player.data.quaternion[2],
      this.player.data.quaternion[3]
    )
    this.rotation = new pc.Vec3(-15 * DEG2RAD, 0, 0)
    this.zoom = InputConfig.DEFAULT_ZOOM
  }

  get camera() {
    return this
  }

  get nametag() {
    return this.movement.nametag
  }

  get bubble() {
    return this.movement.bubble
  }

  get bubbleBox() {
    return this.movement.bubbleBox
  }

  get bubbleText() {
    return this.movement.bubbleText
  }

  getAvatarUrl() {
    return this.movement.getAvatarUrl()
  }

  applyAvatar() {
    return this.movement.applyAvatar()
  }

  setSessionAvatar(avatar) {
    this.movement.setSessionAvatar(avatar)
  }

  addUIToAura(aura) {
    this.movement.addUIToAura(aura)
  }

  setUIText(text) {
    this.movement.setUIText(text)
  }

  setNametagActive(active) {
    this.movement.setNametagActive(active)
  }

  setBubbleActive(active) {
    this.movement.setBubbleActive(active)
  }

  updateCameraForAvatar(avatar) {
    this.camHeight = this.movement.updateCameraForAvatar(avatar)
  }

  updateCameraLook(delta, isXR, control, pan) {
    this.input.updateCameraLook(delta, isXR, control, pan)
  }

  syncTransform() {
    this.movement.syncAvatarTransform(this.player.data.position, this.player.data.quaternion)
    this.movement.syncAuraTransform(this.player.data.position)
    if (this.player.control?.camera) {
      this.movement.syncCameraTransform(
        this.camHeight,
        this.player.world.xr?.session,
        this.player.control.camera,
        this.player.data.position
      )
    }
  }

  clear() {
    this.movement.clear()
  }

  destroy() {
    this.clear()
    this.input.destroy()
    this.movement.destroy()
  }
}
