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
import { PlayerController } from './player/PlayerController.js'
import { PlayerChatBubble } from './player/PlayerChatBubble.js'
import { PlayerInputProcessor } from './player/PlayerInputProcessor.js'
import { AnimationController } from './player/AnimationController.js'
import { NetworkSynchronizer } from './player/NetworkSynchronizer.js'
import { PlayerControlBinder } from './player/PlayerControlBinder.js'
import { PlayerCapsuleFactory } from './player/PlayerCapsuleFactory.js'
import { EVENT } from '../constants/EventNames.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const FORWARD = new THREE.Vector3(0, 0, -1)
const BACKWARD = new THREE.Vector3(0, 0, 1)
const SCALE_IDENTITY = new THREE.Vector3(1, 1, 1)

const { v1, v2, v3, v4, v5, v6, e1, q1, q2, q3, q4, m1, m2, m3 } = SharedVectorPool('PlayerLocal', 6, 4, 1, 3)

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

      this.controller = new PlayerController(this)
      this.chatBubble = new PlayerChatBubble(this)
      this.inputProcessor = new PlayerInputProcessor(this)
      this.animationController = new AnimationController(this)
      this.networkSynchronizer = new NetworkSynchronizer(this)
      this.effectOnEnd = null
      this.controlBinder = new PlayerControlBinder(this)
      this.capsuleFactory = new PlayerCapsuleFactory(this.world)

      if (this.world.loader?.preloader) {
        logger.info('Waiting for preloader')
        await this.world.loader.preloader
        logger.info('Preloader ready')
      }

      if (this.world.loader) {
        logger.info('Applying avatar')
        await this.controller.applyAvatar()
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

  getAvatarUrl() { return this.controller.getAvatarUrl() }
  async applyAvatar() { return this.controller.applyAvatar() }

  initCapsule() {
    const { capsule, capsuleHandle, material } = this.capsuleFactory.createCapsule(this)
    this.capsule = capsule
    this.capsuleHandle = capsuleHandle
    this.material = material
    if (this.capsule) {
      this.physics = new PlayerPhysics(this.world, this)
    }
  }

  get cam() { return this.controller.camera }
  get camHeight() { return this.controller.camera.camHeight }
  set camHeight(value) { this.controller.camera.camHeight = value }

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
    if (this.data.effect?.duration) {
      this.data.effect.duration -= delta
      if (this.data.effect.duration <= 0) {
        this.setEffect(null)
      }
    }
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

    this.controller.syncTransform()
  }

  teleport({ position: pos, rotationY }) {
    const position = new THREE.Vector3()
    position.copy(pos.isVector3 ? pos : new THREE.Vector3().fromArray(pos))
    const hasRotation = isNumber(rotationY)
    const pose = this.capsule.getGlobalPose()
    position.toPxTransform(pose)
    this.capsuleHandle.snap(pose)
    this.base.position.copy(position)
    if (hasRotation) this.base.rotation.y = rotationY
    this.world.network.send('entityModified', {
      id: this.data.id,
      p: this.base.position.toArray(),
      q: this.base.quaternion.toArray(),
      t: true,
    })
    this.cam.position.copy(this.base.position)
    this.cam.position.y += this.camHeight
    if (hasRotation) this.cam.rotation.y = rotationY
    if (this.control?.camera) {
      this.control.camera.position.copy(this.cam.position)
      this.control.camera.quaternion.copy(this.cam.quaternion)
    }
  }
  setEffect(effect, onEnd) {
    if (this.data.effect === effect) return
    if (this.data.effect) {
      this.data.effect = null
      this.effectOnEnd?.()
      this.effectOnEnd = null
    }
    this.data.effect = effect
    this.effectOnEnd = onEnd
    this.world.network.send('entityModified', {
      id: this.data.id,
      ef: effect,
    })
  }
  setSpeaking(speaking) { return this.chatBubble.setSpeaking(speaking) }
  push(force) {
    force = v1.fromArray(force)
    if (this.pushForce) this.pushForce.add(force)
    else { this.pushForce = force.clone(); this.pushForceInit = false }
  }
  setName(name) {
    this.modify({ name })
    this.world.network.send('entityModified', { id: this.data.id, name })
  }
  setSessionAvatar(avatar) { return this.controller.setSessionAvatar(avatar) }
  chat(msg) { return this.chatBubble.chat(msg) }
  modify(data) {
    let avatarChanged
    let changed
    if (data.hasOwnProperty('name')) {
      this.data.name = data.name
      this.world.events.emit('name', { playerId: this.data.id, name: this.data.name })
      changed = true
    }
    if (data.hasOwnProperty('health')) {
      this.data.health = data.health
      this.nametag.health = data.health
      this.world.events.emit('health', { playerId: this.data.id, health: data.health })
    }
    if (data.hasOwnProperty('avatar')) {
      this.data.avatar = data.avatar
      avatarChanged = true
      changed = true
    }
    if (data.hasOwnProperty('sessionAvatar')) {
      this.data.sessionAvatar = data.sessionAvatar
      avatarChanged = true
    }
    if (data.hasOwnProperty('ef')) {
      if (this.data.effect) {
        this.data.effect = null
        this.effectOnEnd?.()
        this.effectOnEnd = null
      }
      this.data.effect = data.ef
    }
    if (data.hasOwnProperty('rank')) {
      this.data.rank = data.rank
      this.world.events.emit('rank', { playerId: this.data.id, rank: this.data.rank })
      changed = true
    }
    if (avatarChanged) {
      this.applyAvatar()
    }
    if (changed) {
      this.world.events.emit('player', this)
    }
  }

  destroy(local) {
    if (this.controller) {
      this.controller.clear()
      this.controller.destroy()
      this.controller = null
    }

    if (this.avatar?.destroy) {
      this.avatar.destroy()
    }

    if (this.chatBubble?.chatTimer) {
      clearTimeout(this.chatBubble.chatTimer)
    }

    if (this.effectOnEnd) {
      this.effectOnEnd = null
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
    this.chatBubble = null
    this.inputProcessor = null
    this.animationController = null
    this.networkSynchronizer = null
    this.effectOnEnd = null
    this.controlBinder = null
    this.capsuleFactory = null

    this.pushForce = null
    this.stick = null
    this.pan = null

    super.destroy(local)
  }
}
