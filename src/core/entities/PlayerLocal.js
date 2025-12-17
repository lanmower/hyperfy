import { BaseEntity } from './BaseEntity.js'
import { clamp } from '../utils.js'
import * as THREE from '../extras/three.js'
import { Layers } from '../extras/assets/Layers.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { createNode } from '../extras/createNode.js'
import { bindRotations } from '../extras/bindRotations.js'
import { simpleCamLerp } from '../extras/simpleCamLerp.js'
import { Emotes } from '../extras/playerEmotes.js'
import { ControlPriorities } from '../extras/assets/ControlPriorities.js'
import { isBoolean, isNumber } from 'lodash-es'
import { hasRank, Ranks } from '../extras/assets/ranks.js'
import { Modes } from '../constants/AnimationModes.js'
import { PlayerPhysics } from './player/PlayerPhysics.js'
import { PlayerPermissions } from './player/PlayerPermissions.js'
import { PlayerInputHandler } from './player/PlayerInputHandler.js'
import { PlayerUIManager } from './player/PlayerUIManager.js'
import { PlayerAvatarManager } from './player/PlayerAvatarManager.js'
import { EVENT } from '../constants/EventNames.js'

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const FORWARD = new THREE.Vector3(0, 0, -1)
const BACKWARD = new THREE.Vector3(0, 0, 1)
const SCALE_IDENTITY = new THREE.Vector3(1, 1, 1)
const POINTER_LOOK_SPEED = 0.1
const PAN_LOOK_SPEED = 0.4
const ZOOM_SPEED = 2
const MIN_ZOOM = 0
const MAX_ZOOM = 8
const STICK_OUTER_RADIUS = 50
const STICK_INNER_RADIUS = 25
const DEFAULT_CAM_HEIGHT = 1.2

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

export class PlayerLocal extends BaseEntity {
  constructor(world, data, local) {
    super(world, data, local)
    this.isPlayer = true
    this.isLocal = true
    this.init()
  }

  async init() {
    this.mass = 1
    this.capsuleRadius = 0.3
    this.capsuleHeight = 1.6

    this.firstPerson = false

    this.mode = Modes.IDLE
    this.axis = new THREE.Vector3()
    this.gaze = new THREE.Vector3()

    this.speaking = false

    this.lastSendAt = 0

    this.base = createNode('group')
    this.base.position.fromArray(this.data.position)
    this.base.quaternion.fromArray(this.data.quaternion)

    this.aura = createNode('group')
    this.ui = new PlayerUIManager(this, this.world)
    this.ui.addToAura(this.aura)

    Object.defineProperty(this, 'nametag', { get: () => this.ui.nametag })
    Object.defineProperty(this, 'bubble', { get: () => this.ui.bubble })
    Object.defineProperty(this, 'bubbleBox', { get: () => this.ui.bubbleBox })
    Object.defineProperty(this, 'bubbleText', { get: () => this.ui.bubbleText })
    Object.defineProperty(this, 'avatar', { get: () => this.avatarManager.avatar })
    Object.defineProperty(this, 'avatarUrl', { get: () => this.avatarManager.avatarUrl, set: (v) => { this.avatarManager.avatarUrl = v } })

    this.aura.activate({ world: this.world, entity: this })
    this.base.activate({ world: this.world, entity: this })

    this.camHeight = DEFAULT_CAM_HEIGHT

    this.cam = {}
    this.cam.position = new THREE.Vector3().copy(this.base.position)
    this.cam.position.y += this.camHeight
    this.cam.quaternion = new THREE.Quaternion()
    this.cam.rotation = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.cam.quaternion, this.cam.rotation)
    this.cam.quaternion.copy(this.base.quaternion)
    this.cam.rotation.x += -15 * DEG2RAD
    this.cam.zoom = 1.5

    if (this.world.loader?.preloader) {
      await this.world.loader.preloader
    }

    this.applyAvatar()
    this.initCapsule()
    this.initControl()

    this.world.setHot(this, true)
    this.world.events.emit('ready', true)
  }

  getAvatarUrl() {
    return this.avatarManager.getAvatarUrl()
  }

  applyAvatar() {
    return this.avatarManager.applyAvatar()
  }

  initCapsule() {
    const radius = this.capsuleRadius
    const height = this.capsuleHeight
    const halfHeight = (height - radius - radius) / 2
    const geometry = new PHYSX.PxCapsuleGeometry(radius, halfHeight)
    this.material = this.world.physics.physics.createMaterial(0, 0, 0)
    const flags = new PHYSX.PxShapeFlags(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE) // prettier-ignore
    const shape = this.world.physics.physics.createShape(geometry, this.material, true, flags)
    const localPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    q1.set(0, 0, 0).setFromAxisAngle(BACKWARD, Math.PI / 2)
    q1.toPxTransform(localPose)
    v1.set(0, halfHeight + radius, 0)
    v1.toPxTransform(localPose)
    shape.setLocalPose(localPose)
    const filterData = new PHYSX.PxFilterData(
      Layers.player.group,
      Layers.player.mask,
      PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND |
        PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST |
        PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS |
        PHYSX.PxPairFlagEnum.eDETECT_CCD_CONTACT |
        PHYSX.PxPairFlagEnum.eSOLVE_CONTACT |
        PHYSX.PxPairFlagEnum.eDETECT_DISCRETE_CONTACT,
      0
    )
    shape.setContactOffset(0.08) // just enough to fire contacts (because we muck with velocity sometimes standing on a thing doesn't contact)
    shape.setQueryFilterData(filterData)
    shape.setSimulationFilterData(filterData)
    const transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    v1.copy(this.base.position).toPxTransform(transform)
    q1.set(0, 0, 0, 1).toPxTransform(transform)
    this.capsule = this.world.physics.physics.createRigidDynamic(transform)
    this.capsule.setMass(this.mass)
    this.capsule.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eENABLE_CCD, true)
    this.capsule.setRigidDynamicLockFlag(PHYSX.PxRigidDynamicLockFlagEnum.eLOCK_ANGULAR_X, true)
    this.capsule.setRigidDynamicLockFlag(PHYSX.PxRigidDynamicLockFlagEnum.eLOCK_ANGULAR_Z, true)
    this.capsule.setActorFlag(PHYSX.PxActorFlagEnum.eDISABLE_GRAVITY, true)
    this.capsule.attachShape(shape)
    let shape2
    {
    }
    this.capsuleHandle = this.world.physics.addActor(this.capsule, {
      tag: null,
      playerId: this.data.id,
      onInterpolate: position => {
        this.base.position.copy(position)
      },
    })

    this.physics = new PlayerPhysics(this.world, this)
    this.permissions = new PlayerPermissions(this, this.world)
    this.inputHandler = new PlayerInputHandler(this.world.camera, this.world)
    this.avatarManager = new PlayerAvatarManager(this, this.world)
  }

  initControl() {
    this.control = this.world.controls.bind({
      priority: ControlPriorities.PLAYER,
      onTouch: touch => {
        if (!this.stick && touch.position.x < this.control.screen.width / 2) {
          this.stick = {
            center: touch.position.clone(),
            active: false,
            touch,
          }
        } else if (!this.pan) {
          this.pan = touch
        }
      },
      onTouchEnd: touch => {
        if (this.stick?.touch === touch) {
          this.stick = null
          this.world.events.emit('stick', null)
        }
        if (this.pan === touch) {
          this.pan = null
        }
      },
    })
    this.control.camera.write = true
    this.control.camera.position.copy(this.cam.position)
    this.control.camera.quaternion.copy(this.cam.quaternion)
    this.control.camera.zoom = this.cam.zoom
  }

  toggleFlying(value) {
    value = isBoolean(value) ? value : !this.physics.flying
    if (this.physics.flying === value) return
    this.physics.flying = value
    if (this.physics.flying) {
      const velocity = this.capsule.getLinearVelocity()
      velocity.y = 0
      this.capsule.setLinearVelocity(velocity)
    }
  }

  getAnchorMatrix() {
    if (this.data.effect?.anchorId) {
      return this.world.anchors.get(this.data.effect.anchorId)
    }
    return null
  }

  outranks(otherPlayer) {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    const otherRank = Math.max(otherPlayer.data.rank, this.world.settings.effectiveRank)
    return rank > otherRank
  }

  isAdmin() {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    return hasRank(rank, Ranks.ADMIN)
  }

  isBuilder() {
    const rank = Math.max(this.data.rank, this.world.settings.effectiveRank)
    return hasRank(rank, Ranks.BUILDER)
  }

  isMuted() {
    return this.world.livekit.isMuted(this.data.id)
  }

  fixedUpdate(delta) {
    this.physics.update(delta)
  }

  update(delta) {
    const isXR = this.world.xr?.session
    const freeze = this.data.effect?.freeze
    const anchor = this.getAnchorMatrix()

    if (isXR) {
      this.cam.rotation.x = 0
      this.cam.rotation.z = 0
      if (this.control.xrRightStick.value.x === 0 && this.didSnapTurn) {
        this.didSnapTurn = false
      } else if (this.control.xrRightStick.value.x > 0 && !this.didSnapTurn) {
        this.cam.rotation.y -= 45 * DEG2RAD
        this.didSnapTurn = true
      } else if (this.control.xrRightStick.value.x < 0 && !this.didSnapTurn) {
        this.cam.rotation.y += 45 * DEG2RAD
        this.didSnapTurn = true
      }
    } else if (this.control.pointer.locked) {
      this.cam.rotation.x += -this.control.pointer.delta.y * POINTER_LOOK_SPEED * delta
      this.cam.rotation.y += -this.control.pointer.delta.x * POINTER_LOOK_SPEED * delta
      this.cam.rotation.z = 0
    } else if (this.pan) {
      this.cam.rotation.x += -this.pan.delta.y * PAN_LOOK_SPEED * delta
      this.cam.rotation.y += -this.pan.delta.x * PAN_LOOK_SPEED * delta
      this.cam.rotation.z = 0
    }

    if (!isXR) {
      this.cam.rotation.x = clamp(this.cam.rotation.x, -89 * DEG2RAD, 89 * DEG2RAD)
    }

    if (!isXR) {
      this.cam.zoom += -this.control.scrollDelta.value * ZOOM_SPEED * delta
      this.cam.zoom = clamp(this.cam.zoom, MIN_ZOOM, MAX_ZOOM)
    }

    if (isXR && !this.xrActive) {
      this.cam.zoom = 0
      this.xrActive = true
    } else if (!isXR && this.xrActive) {
      this.cam.zoom = 1
      this.xrActive = false
    }

    if (this.cam.zoom < 1 && !this.firstPerson) {
      this.cam.zoom = 0
      this.firstPerson = true
      this.avatar.visible = false
    } else if (this.cam.zoom > 0 && this.firstPerson) {
      this.cam.zoom = 1
      this.firstPerson = false
      this.avatar.visible = true
    }

    if (this.stick && !this.stick.active) {
      this.stick.active = this.stick.center.distanceTo(this.stick.touch.position) > 3
    }

    this.jumpDown = isXR ? this.control.xrRightBtn1.down : this.control.space.down || this.control.touchA.down
    if (isXR ? this.control.xrRightBtn1.pressed : this.control.space.pressed || this.control.touchA.pressed) {
      this.jumpPressed = true
    }

    this.physics.moveDir.set(0, 0, 0)
    if (isXR) {
      this.physics.moveDir.x = this.control.xrLeftStick.value.x
      this.physics.moveDir.z = this.control.xrLeftStick.value.z
    } else if (this.stick?.active) {
      const touchX = this.stick.touch.position.x
      const touchY = this.stick.touch.position.y
      const centerX = this.stick.center.x
      const centerY = this.stick.center.y
      const dx = centerX - touchX
      const dy = centerY - touchY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const moveRadius = STICK_OUTER_RADIUS - STICK_INNER_RADIUS
      if (distance > moveRadius) {
        this.stick.center.x = touchX + (moveRadius * dx) / distance
        this.stick.center.y = touchY + (moveRadius * dy) / distance
      }
      const stickX = (touchX - this.stick.center.x) / moveRadius
      const stickY = (touchY - this.stick.center.y) / moveRadius
      this.physics.moveDir.x = stickX
      this.physics.moveDir.z = stickY
      this.world.events.emit('stick', this.stick)
    } else {
      if (this.control.keyW.down || this.control.arrowUp.down) this.physics.moveDir.z -= 1
      if (this.control.keyS.down || this.control.arrowDown.down) this.physics.moveDir.z += 1
      if (this.control.keyA.down || this.control.arrowLeft.down) this.physics.moveDir.x -= 1
      if (this.control.keyD.down || this.control.arrowRight.down) this.physics.moveDir.x += 1
    }

    this.physics.moving = this.physics.moveDir.length() > 0

    if (this.data.effect?.cancellable && (this.physics.moving || this.jumpDown)) {
      this.setEffect(null)
    }

    if (freeze || anchor) {
      this.physics.moveDir.set(0, 0, 0)
      this.physics.moving = false
    }

    if (this.stick?.active || isXR) {
      this.running = this.physics.moving && this.physics.moveDir.length() > 0.9
    } else {
      this.running = this.physics.moving && (this.control.shiftLeft.down || this.control.shiftRight.down)
    }

    this.physics.moveDir.normalize()

    if (isXR) {
      this.physics.flyDir.copy(this.physics.moveDir)
      this.physics.flyDir.applyQuaternion(this.world.xr.camera.quaternion)
    } else {
      this.physics.flyDir.copy(this.physics.moveDir)
      this.physics.flyDir.applyQuaternion(this.cam.quaternion)
    }

    this.axis.copy(this.physics.moveDir)

    const moveRad = Math.atan2(this.axis.x, -this.axis.z)
    let moveDeg = moveRad * RAD2DEG
    if (moveDeg < 0) moveDeg += 360

    if (isXR) {
      e1.copy(this.world.xr.camera.rotation).reorder('YXZ')
      e1.y += this.cam.rotation.y
      const yQuaternion = q1.setFromAxisAngle(UP, e1.y)
      this.physics.moveDir.applyQuaternion(yQuaternion)
    } else {
      const yQuaternion = q1.setFromAxisAngle(UP, this.cam.rotation.y)
      this.physics.moveDir.applyQuaternion(yQuaternion)
    }

    let rotY = 0
    let applyRotY
    if (isXR) {
      e1.copy(this.world.xr.camera.rotation).reorder('YXZ')
      rotY = e1.y + this.cam.rotation.y
    } else {
      rotY = this.cam.rotation.y
    }
    if (this.data.effect?.turn) {
      applyRotY = true
    } else if (this.physics.moving || this.firstPerson) {
      applyRotY = true
    }

    if (applyRotY) {
      e1.set(0, rotY, 0)
      q1.setFromEuler(e1)
      const alpha = 1 - Math.pow(0.00000001, delta)
      this.base.quaternion.slerp(q1, alpha)
    }

    let emote
    if (this.data.effect?.emote) {
      emote = this.data.effect.emote
    }
    if (this.emote !== emote) {
      this.emote = emote
    }
    this.avatar?.setEmote(this.emote)

    let mode
    if (this.data.effect?.emote) {
    } else if (this.physics.flying) {
      mode = Modes.FLY
    } else if (this.physics.airJumping) {
      mode = Modes.FLIP
    } else if (this.physics.jumping) {
      mode = Modes.JUMP
    } else if (this.physics.falling) {
      mode = this.physics.fallDistance > 1.6 ? Modes.FALL : Modes.JUMP
    } else if (this.physics.moving) {
      mode = this.running ? Modes.RUN : Modes.WALK
    } else if (this.speaking) {
      mode = Modes.TALK
    }
    if (!mode) mode = Modes.IDLE
    this.mode = mode

    if (isXR) {
      this.gaze.copy(FORWARD).applyQuaternion(this.world.xr.camera.quaternion)
    } else {
      this.gaze.copy(FORWARD).applyQuaternion(this.cam.quaternion)
      if (!this.firstPerson) {
        v1.copy(gazeTiltAxis).applyQuaternion(this.cam.quaternion) // tilt in cam space
        this.gaze.applyAxisAngle(v1, gazeTiltAngle) // positive for upward tilt
      }
    }

    this.avatar?.instance?.setLocomotion(this.mode, this.axis, this.gaze)

    this.lastSendAt += delta
    if (this.lastSendAt >= this.world.networkRate) {
      if (!this.lastState) {
        this.lastState = {
          id: this.data.id,
          p: this.base.position.clone(),
          q: this.base.quaternion.clone(),
          m: this.mode,
          a: this.axis.clone(),
          g: this.gaze.clone(),
          e: null,
        }
      }
      const data = {
        id: this.data.id,
      }
      let hasChanges
      if (!this.lastState.p.equals(this.base.position)) {
        data.p = this.base.position.toArray()
        this.lastState.p.copy(this.base.position)
        hasChanges = true
      }
      if (!this.lastState.q.equals(this.base.quaternion)) {
        data.q = this.base.quaternion.toArray()
        this.lastState.q.copy(this.base.quaternion)
        hasChanges = true
      }
      if (this.lastState.m !== this.mode) {
        data.m = this.mode
        this.lastState.m = this.mode
        hasChanges = true
      }
      if (!this.lastState.a.equals(this.axis)) {
        data.a = this.axis.toArray()
        this.lastState.a.copy(this.axis)
        hasChanges = true
      }
      if (!this.lastState.g.equals(this.gaze)) {
        data.g = this.gaze.toArray()
        this.lastState.g.copy(this.gaze)
        hasChanges = true
      }
      if (this.lastState.e !== this.emote) {
        data.e = this.emote
        this.lastState.e = this.emote
        hasChanges = true
      }
      if (hasChanges) {
        this.world.network.send('entityModified', data)
      }
      this.lastSendAt = 0
    }

    if (this.data.effect?.duration) {
      this.data.effect.duration -= delta
      if (this.data.effect.duration <= 0) {
        this.setEffect(null)
      }
    }
  }

  lateUpdate(delta) {
    const isXR = this.world.xr?.session
    const anchor = this.getAnchorMatrix()
    if (anchor) {
      this.base.position.setFromMatrixPosition(anchor)
      this.base.quaternion.setFromRotationMatrix(anchor)
      const pose = this.capsule.getGlobalPose()
      this.base.position.toPxTransform(pose)
      this.capsuleHandle.snap(pose)
    }
    this.cam.position.copy(this.base.position)
    if (isXR) {
    } else {
      this.cam.position.y += this.camHeight
      if (!this.firstPerson) {
        const forward = v1.copy(FORWARD).applyQuaternion(this.cam.quaternion)
        const right = v2.crossVectors(forward, UP).normalize()
        this.cam.position.add(right.multiplyScalar(0.3))
      }
    }
    if (this.world.xr?.session) {
      this.control.camera.position.copy(this.cam.position)
      this.control.camera.quaternion.copy(this.cam.quaternion)
    } else {
      simpleCamLerp(this.world, this.control.camera, this.cam, delta)
    }
    if (this.avatar) {
      const matrix = this.avatar.getBoneTransform('head')
      if (matrix) this.aura.position.setFromMatrixPosition(matrix)
    }
  }

  teleport({ position, rotationY }) {
    position = position.isVector3 ? position : new THREE.Vector3().fromArray(position)
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
    this.control.camera.position.copy(this.cam.position)
    this.control.camera.quaternion.copy(this.cam.quaternion)
  }

  setEffect(effect, onEnd) {
    if (this.data.effect === effect) return
    if (this.data.effect) {
      this.data.effect = null
      this.onEffectEnd?.()
      this.onEffectEnd = null
    }
    this.data.effect = effect
    this.onEffectEnd = onEnd
    this.world.network.send('entityModified', {
      id: this.data.id,
      ef: effect,
    })
  }

  setSpeaking(speaking) {
    if (this.speaking === speaking) return
    if (speaking && this.isMuted()) return
    this.speaking = speaking
  }

  push(force) {
    force = v1.fromArray(force)
    if (this.pushForce) {
      this.pushForce.add(force)
    }
    else {
      this.pushForce = force.clone()
      this.pushForceInit = false
    }
  }

  setName(name) {
    this.modify({ name })
    this.world.network.send('entityModified', { id: this.data.id, name })
  }

  setSessionAvatar(avatar) {
    this.data.sessionAvatar = avatar
    this.applyAvatar()
    this.world.network.send('entityModified', {
      id: this.data.id,
      sessionAvatar: avatar,
    })
  }

  chat(msg) {
    this.nametag.active = false
    this.bubbleText.value = msg
    this.bubble.active = true
    clearTimeout(this.chatTimer)
    this.chatTimer = setTimeout(() => {
      this.bubble.active = false
      this.nametag.active = true
    }, 5000)
  }

  modify(data) {
    let avatarChanged
    let changed
    if (data.hasOwnProperty('name')) {
      this.data.name = data.name
      this.world.events.emit(EVENT.name, { playerId: this.data.id, name: this.data.name })
      changed = true
    }
    if (data.hasOwnProperty('health')) {
      this.data.health = data.health
      this.nametag.health = data.health
      this.world.events.emit(EVENT.health, { playerId: this.data.id, health: data.health })
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
        this.onEffectEnd?.()
        this.onEffectEnd = null
      }
      this.data.effect = data.ef
    }
    if (data.hasOwnProperty('rank')) {
      this.data.rank = data.rank
      this.world.events.emit(EVENT.rank, { playerId: this.data.id, rank: this.data.rank })
      changed = true
    }
    if (avatarChanged) {
      this.applyAvatar()
    }
    if (changed) {
      this.world.events.emit('player', this)
    }
  }
}
