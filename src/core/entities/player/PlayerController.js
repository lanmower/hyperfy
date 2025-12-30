/* Unified player management coordinator consolidating avatar, camera, UI, and transform sync */

import * as THREE from '../../extras/three.js'
import { AvatarConfig } from '../../config/SystemConfig.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { DEG2RAD } from '../../extras/general.js'
import { bindRotations } from '../../extras/bindRotations.js'
import { clamp } from '../../utils.js'
import { DEFAULT_CAM_HEIGHT, POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from "./CameraConstants.js"
import { InputConfig } from "../../config/SystemConfig.js"
import { XRInputStrategy } from './input/XRInputStrategy.js'
import { PointerLockInputStrategy } from './input/PointerLockInputStrategy.js'
import { TouchPanInputStrategy } from './input/TouchPanInputStrategy.js'
import { ScrollZoomStrategy } from './input/ScrollZoomStrategy.js'
import { createNode } from '../../extras/createNode.js'

const logger = new ComponentLogger('PlayerController')

export class PlayerController {
  constructor(player) {
    this.player = player
    this.initCamera()
    this.initUI()
    this.transformSync = { pendingUpdates: new Set(), isDirty: false }
  }

  initCamera() {
    this.camHeight = DEFAULT_CAM_HEIGHT
    this.position = new THREE.Vector3().copy(this.player.base.position)
    this.position.y += this.camHeight
    this.quaternion = new THREE.Quaternion()
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion, this.rotation)
    this.quaternion.copy(this.player.base.quaternion)
    this.rotation.x = -15 * DEG2RAD
    this.zoom = InputConfig.DEFAULT_ZOOM
  }

  initUI() {
    this.nametag = createNode('nametag', { label: '', health: this.player.data.health, active: false })
    this.bubble = createNode('ui', {
      id: 'bubble',
      width: 300,
      height: 512,
      pivot: 'bottom-center',
      billboard: 'full',
      scaler: [3, 30],
      justifyContent: 'flex-end',
      alignItems: 'center',
      active: false,
    })
    this.bubbleBox = createNode('uiview', {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
    })
    this.bubbleText = createNode('uitext', {
      color: 'white',
      fontWeight: 100,
      lineHeight: 1.4,
      fontSize: 16,
    })
    this.bubble.add(this.bubbleBox)
    this.bubbleBox.add(this.bubbleText)
  }

  getAvatarUrl() {
    return this.player.data.sessionAvatar || this.player.data.avatar || 'asset://avatar.vrm'
  }

  async applyAvatar() {
    const avatarUrl = this.getAvatarUrl()
    if (this.player.avatarUrl === avatarUrl) return
    return new Promise((resolve, reject) => {
      this.player.world.loader
        .load('avatar', avatarUrl)
        .then(src => {
          if (this.player.avatar?.destroy) this.player.avatar.destroy()
          try {
            const hooks = {
              scene: this.player.world.stage.scene,
              camera: this.player.world.camera,
              loader: this.player.world.loader,
              setupMaterial: this.player.world.setupMaterial,
            }
            const identityMatrix = new THREE.Matrix4()
            this.player.avatar = src.factory.create(identityMatrix, hooks, this.player)
            if (this.player.avatar?.disableRateCheck) {
              this.player.avatar.disableRateCheck()
            }
            if (this.player.avatar?.raw?.scene instanceof THREE.Object3D) {
              this.player.base.add(this.player.avatar.raw.scene)
            }
            this.player.avatarUrl = avatarUrl
            const avatarHeight = this.player.avatar?.height || AvatarConfig.DEFAULT_HEIGHT
            this.camHeight = avatarHeight * 0.9
            const headHeight = this.player.avatar?.getHeadToHeight?.() || AvatarConfig.DEFAULT_HEIGHT
            if (this.nametag?.position) {
              this.nametag.position.y = headHeight + 0.2
            }
            if (this.bubble?.position) {
              this.bubble.position.y = headHeight + 0.2
            }
            if (!this.bubble.active) {
              this.nametag.active = true
            }
            resolve(this.player.avatar)
          } catch (err) {
            logger.error('Failed to create avatar from factory', { error: err.message, avatarUrl })
            reject(err)
          }
        })
        .catch(err => {
          logger.error('Failed to load avatar asset', { error: err.message, avatarUrl })
          reject(err)
        })
    })
  }

  setSessionAvatar(avatar) {
    this.player.data.sessionAvatar = avatar
    this.applyAvatar()
    this.player.world.network.send('entityModified', {
      id: this.player.data.id,
      sessionAvatar: avatar,
    })
  }

  addUIToAura(aura) {
    aura.add(this.nametag)
    aura.add(this.bubble)
  }

  setUIText(text) {
    this.bubbleText.text = text
  }

  setNametagActive(active) {
    this.nametag.active = active
  }

  setBubbleActive(active) {
    this.bubble.active = active
  }

  updateCameraForAvatar(avatar) {
    this.camHeight = avatar.height * 0.9
  }

  updateCameraLook(delta, isXR, control, pan) {
    const strategy = this.selectInputStrategy(isXR, control, pan)
    if (strategy) {
      strategy.updateLook(delta, control, { pan })
    }
    const zoomStrategy = new ScrollZoomStrategy(this)
    if (!isXR) {
      zoomStrategy.updateZoom(delta, control)
    }
  }

  selectInputStrategy(isXR, control, pan) {
    if (isXR) {
      if (!this.xrStrategy) this.xrStrategy = new XRInputStrategy(this)
      return this.xrStrategy
    }
    if (control.pointer.locked) {
      if (!this.pointerStrategy) this.pointerStrategy = new PointerLockInputStrategy(this)
      return this.pointerStrategy
    }
    if (pan) {
      if (!this.panStrategy) this.panStrategy = new TouchPanInputStrategy(this)
      return this.panStrategy
    }
    return null
  }

  markTransformDirty(object) {
    if (!object) return
    this.transformSync.pendingUpdates.add(object)
    this.transformSync.isDirty = true
  }

  syncAvatarTransform() {
    if (!this.player.avatar?.raw?.scene) return
    const scene = this.player.avatar.raw.scene
    const base = this.player.base
    scene.position.copy(base.position)
    scene.quaternion.copy(base.quaternion)
    this.markTransformDirty(scene)
  }

  syncAuraTransform() {
    if (!this.player.aura) return
    const aura = this.player.aura
    if (this.player.avatar?.getBoneTransform) {
      try {
        const matrix = this.player.avatar.getBoneTransform('head')
        if (matrix) {
          aura.position.setFromMatrixPosition(matrix)
          this.markTransformDirty(aura)
        }
      } catch (err) {
        logger.warn('getBoneTransform error', err)
      }
    }
  }

  syncCameraTransform() {
    if (!this.player.cam) return
    this.player.cam.position.copy(this.player.base.position)
    if (!this.player.world.xr?.session) {
      this.player.cam.position.y += this.camHeight
    }
    if (this.player.control?.camera) {
      if (this.player.world.xr?.session) {
        this.player.control.camera.position.copy(this.player.cam.position)
        this.player.control.camera.quaternion.copy(this.player.cam.quaternion)
      }
      this.markTransformDirty(this.player.control.camera)
    }
  }

  updateMatrices() {
    if (!this.transformSync.isDirty || this.transformSync.pendingUpdates.size === 0) return
    for (const object of this.transformSync.pendingUpdates) {
      if (!object) continue
      object.updateMatrix()
    }
    this.transformSync.isDirty = false
  }

  updateMatrixWorldAll() {
    for (const object of this.transformSync.pendingUpdates) {
      if (!object) continue
      object.updateMatrixWorld(true)
    }
    this.transformSync.pendingUpdates.clear()
  }

  syncTransform() {
    this.syncAvatarTransform()
    this.syncAuraTransform()
    this.syncCameraTransform()
    this.updateMatrices()
    this.updateMatrixWorldAll()
  }

  clear() {
    this.transformSync.pendingUpdates.clear()
    this.transformSync.isDirty = false
  }

  destroy() {
    this.clear()
    this.xrStrategy = null
    this.pointerStrategy = null
    this.panStrategy = null
  }
}
