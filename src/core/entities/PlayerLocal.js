import { BaseEntity } from './BaseEntity.js'
import { clamp } from '../utils.js'
import * as THREE from '../extras/three.js'
import { Layers } from '../extras/Layers.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { createNode } from '../extras/createNode.js'
import { bindRotations } from '../extras/bindRotations.js'
import { simpleCamLerp } from '../extras/simpleCamLerp.js'
import { Emotes } from '../extras/playerEmotes.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { isBoolean, isNumber } from 'lodash-es'
import { hasRank, Ranks } from '../extras/ranks.js'
import { PhysicsConfig } from '../config/SystemConfig.js'
import { Modes } from '../constants/AnimationModes.js'
import { PlayerPhysics } from './player/PlayerPhysics.js'
import { PlayerCameraManager } from './player/PlayerCameraManager.js'
import { PlayerAvatarManager } from './player/PlayerAvatarManager.js'
import { PlayerChatBubble } from './player/PlayerChatBubble.js'
import { PlayerInputProcessor } from './player/PlayerInputProcessor.js'
import { AnimationController } from './player/AnimationController.js'
import { NetworkSynchronizer } from './player/NetworkSynchronizer.js'
import { PlayerTeleportHandler } from './player/PlayerTeleportHandler.js'
import { PlayerEffectManager } from './player/PlayerEffectManager.js'
import { PlayerModifyHandler } from './player/PlayerModifyHandler.js'
import { PlayerControlBinder } from './player/PlayerControlBinder.js'
import { PlayerCapsuleFactory } from './player/PlayerCapsuleFactory.js'
import { EVENT } from '../constants/EventNames.js'
import { POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from './player/CameraConstants.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const FORWARD = new THREE.Vector3(0, 0, -1)
const BACKWARD = new THREE.Vector3(0, 0, 1)
const SCALE_IDENTITY = new THREE.Vector3(1, 1, 1)

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const v5 = new THREE.Vector3()
const v6 = new THREE.Vector3()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const q3 = new THREE.Quaternion()
const q4 = new THREE.Quaternion()
const m1 = new THREE.Matrix4()
const m2 = new THREE.Matrix4()
const m3 = new THREE.Matrix4()

const gazeTiltAngle = 10 * DEG2RAD
const gazeTiltAxis = new THREE.Vector3(1, 0, 0)
const logger = new ComponentLogger('PlayerLocal')

export class PlayerLocal extends BaseEntity {
  constructor(world, data, local) {
    logger.info('constructor called', { userId: data.userId, id: data.id })
    super(world, data, local)
    this.isPlayer = true
    this.isLocal = true
    logger.info('Calling init()')
    this.init()
    logger.info('init() called (returns promise)')
  }

  async init() {
    try {
      logger.info('init() started')
      this.mass = PhysicsConfig.MASS
      this.capsuleRadius = PhysicsConfig.CAPSULE_RADIUS
      this.capsuleHeight = PhysicsConfig.CAPSULE_HEIGHT

      this.firstPerson = false

      this.mode = Modes.IDLE
      this.axis = new THREE.Vector3()
      this.gaze = new THREE.Vector3()

      this.speaking = false

      this.lastSendAt = 0

      this.base = new THREE.Object3D()
      this.base.position.fromArray(this.data.position)
      this.base.quaternion.fromArray(this.data.quaternion)
      this.world.stage.scene.add(this.base)

      this.aura = new THREE.Object3D()
      this.world.stage.scene.add(this.aura)

      this.nametag = createNode('nametag', { label: '', health: this.data.health, active: false })
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

      this.avatar = null
      this.avatarUrl = null

      this.cam = new PlayerCameraManager(this, this.base)
      this.avatarManager = new PlayerAvatarManager(this)
      this.chatBubble = new PlayerChatBubble(this)
      this.inputProcessor = new PlayerInputProcessor(this)
      this.animationController = new AnimationController(this)
      this.networkSynchronizer = new NetworkSynchronizer(this)
      this.teleportHandler = new PlayerTeleportHandler(this)
      this.effectManager = new PlayerEffectManager(this)
      this.modifyHandler = new PlayerModifyHandler(this)
      this.controlBinder = new PlayerControlBinder(this)
      this.capsuleFactory = new PlayerCapsuleFactory(this.world)

      if (this.world.loader?.preloader) {
        logger.info('Waiting for preloader')
        await this.world.loader.preloader
        logger.info('Preloader ready')
      }

      if (this.world.loader) {
        logger.info('Applying avatar')
        await this.avatarManager.applyAvatar()
        logger.info('Avatar applied')
      } else {
        logger.info('Loader not available, skipping avatar')
      }

      logger.info('About to call initCapsule')
      this.initCapsule()
      logger.info('Capsule initialized', { capsule: !!this.capsule, physics: !!this.physics })

      this.controlBinder.initControl()
      logger.info('Control binding initialized')

      this.world.setHot(this, true)
      logger.info('Player marked as hot, emitting ready event')
      this.world.events.emit('ready', true)
      logger.info('init() completed')
    } catch (err) {
      logger.error('init() error', err)
      this.world.setHot(this, true)
      this.world.events.emit('ready', true)
      logger.info('Ready event emitted from catch block')
    }
  }

  getAvatarUrl() { return this.avatarManager.getAvatarUrl() }
  async applyAvatar() { return this.avatarManager.applyAvatar() }

  initCapsule() {
    const { capsule, capsuleHandle, material } = this.capsuleFactory.createCapsule(this)
    this.capsule = capsule
    this.capsuleHandle = capsuleHandle
    this.material = material
    if (this.capsule) {
      this.physics = new PlayerPhysics(this.world, this)
    }
  }

  get stick() { return this.controlBinder.stick }
  set stick(value) { this.controlBinder.stick = value }
  get pan() { return this.controlBinder.pan }
  set pan(value) { this.controlBinder.pan = value }

  toggleFlying(value) {
    if (!this.physics) return
    value = isBoolean(value) ? value : !this.physics.flying
    if (this.physics.flying === value) return
    this.physics.flying = value
    if (this.physics.flying) {
      const velocity = this.capsule.getLinearVelocity()
      velocity.y = 0
      this.capsule.setLinearVelocity(velocity)
    }
  }

  getAnchorMatrix() { return this.data.effect?.anchorId ? this.world.anchors.get(this.data.effect.anchorId) : null }
  outranks(otherPlayer) {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    const otherRank = Math.max(otherPlayer.data.rank, this.world.settings.effectiveRank)
    return rank > otherRank
  }
  isAdmin() { return hasRank(Math.max(this.data.rank, this.world.settings.effectiveRank), Ranks.ADMIN) }
  isBuilder() { return hasRank(Math.max(this.data.rank, this.world.settings.effectiveRank), Ranks.BUILDER) }
  isMuted() { return this.world.livekit.isMuted(this.data.id) }

  fixedUpdate(delta) { this.physics?.update(delta) }

  update(delta) {
    const freeze = this.data.effect?.freeze
    const anchor = this.getAnchorMatrix()

    this.inputProcessor.processCamera(delta)
    this.inputProcessor.processZoom(delta)
    this.inputProcessor.processStickActivation()
    this.inputProcessor.processJump()
    this.inputProcessor.processMovement(delta)

    if (this.physics) {
      this.physics.moving = this.physics.moveDir.length() > 0

      if (this.data.effect?.cancellable && (this.physics.moving || this.jumpDown)) {
        this.setEffect(null)
      }

      if (freeze || anchor) {
        this.physics.moveDir.set(0, 0, 0)
        this.physics.moving = false
      }
    }

    this.inputProcessor.processRunning()
    this.inputProcessor.applyMovementRotation()
    this.inputProcessor.applyBodyRotation(delta)

    this.animationController.updateEmote()
    this.mode = this.animationController.updateAnimationMode()
    if (this.mode === undefined || this.mode === null) {
      this.mode = Modes.IDLE
    }
    this.animationController.updateGaze()
    this.animationController.applyAvatarLocomotion()
    this.avatar?.update?.(delta)

    this.networkSynchronizer.sync(delta)
    this.effectManager.updateDuration(delta)
  }

  lateUpdate(delta) {
    const anchor = this.getAnchorMatrix()
    if (anchor) {
      this.base.position.setFromMatrixPosition(anchor)
      this.base.quaternion.setFromRotationMatrix(anchor)
      const pose = this.capsule.getGlobalPose()
      this.base.position.toPxTransform(pose)
      this.capsuleHandle.snap(pose)
    }
    this.cam.position.copy(this.base.position)
    if (!this.world.xr?.session) {
      this.cam.position.y += this.camHeight
      if (!this.firstPerson) {
        const forward = v1.copy(FORWARD).applyQuaternion(this.cam.quaternion)
        const right = v2.crossVectors(forward, UP).normalize()
        this.cam.position.add(right.multiplyScalar(0.3))
      }
    }
    if (this.world.xr?.session) {
      if (this.control?.camera) {
        this.control.camera.position.copy(this.cam.position)
        this.control.camera.quaternion.copy(this.cam.quaternion)
      }
    } else if (this.control?.camera) {
      simpleCamLerp(this.world, this.control.camera, this.cam, delta)
      window.__DEBUG__.cameraDist = this.control.camera.position.distanceTo(this.cam.position)
      window.__DEBUG__.cameraZoom = this.control.camera.zoom
    }

    if (this.avatar && this.avatar.raw && this.avatar.raw.scene) {
      const scene = this.avatar.raw.scene
      scene.position.copy(this.base.position)
      scene.quaternion.copy(this.base.quaternion)
      scene.updateMatrix()
      scene.updateMatrixWorld(true)
    }

    if (this.avatar && this.avatar.getBoneTransform) {
      try {
        const matrix = this.avatar.getBoneTransform('head')
        if (matrix && this.aura) {
          this.aura.position.setFromMatrixPosition(matrix)
        }
      } catch (err) {
        logger.warn('getBoneTransform error', err)
      }
    }
  }

  teleport({ position, rotationY }) { this.teleportHandler.teleport({ position, rotationY }) }
  setEffect(effect, onEnd) { this.effectManager.setEffect(effect, onEnd) }
  setSpeaking(speaking) { return this.chatBubble.setSpeaking(speaking) }
  push(force) {
    force = v1.fromArray(force)
    if (this.pushForce) this.pushForce.add(force)
    else { this.pushForce = force.clone(); this.pushForceInit = false }
  }
  setName(name) {
    this.modifyHandler.modify({ name })
    this.world.network.send('entityModified', { id: this.data.id, name })
  }
  setSessionAvatar(avatar) { return this.avatarManager.setSessionAvatar(avatar) }
  chat(msg) { return this.chatBubble.chat(msg) }
  modify(data) { this.modifyHandler.modify(data) }

  destroy(local) {
    if (this.avatar?.destroy) {
      this.avatar.destroy()
    }

    if (this.chatBubble?.chatTimer) {
      clearTimeout(this.chatBubble.chatTimer)
    }

    if (this.effectManager?.onEffectEnd) {
      this.effectManager.onEffectEnd = null
    }

    if (this.controlBinder?.stick) {
      this.controlBinder.stick = null
    }

    if (this.controlBinder?.pan) {
      this.controlBinder.pan = null
    }

    if (this.control) {
      this.control.release()
      this.control = null
    }

    if (this.capsule && this.capsuleHandle && this.world.physics) {
      this.world.physics.removeActor(this.capsuleHandle)
      this.capsule = null
      this.capsuleHandle = null
    }

    if (this.material) {
      this.material = null
    }

    if (this.base && this.world.stage?.scene) {
      this.world.stage.scene.remove(this.base)
      this.base = null
    }

    if (this.aura && this.world.stage?.scene) {
      this.world.stage.scene.remove(this.aura)
      this.aura = null
    }

    if (this.avatar?.raw?.scene && this.base) {
      this.base.remove(this.avatar.raw.scene)
    }

    this.nametag = null
    this.bubble = null
    this.bubbleBox = null
    this.bubbleText = null
    this.avatar = null
    this.avatarUrl = null

    this.physics = null
    this.cam = null
    this.avatarManager = null
    this.chatBubble = null
    this.inputProcessor = null
    this.animationController = null
    this.networkSynchronizer = null
    this.teleportHandler = null
    this.effectManager = null
    this.modifyHandler = null
    this.controlBinder = null
    this.capsuleFactory = null

    this.pushForce = null
    this.stick = null
    this.pan = null

    super.destroy(local)
  }
}
