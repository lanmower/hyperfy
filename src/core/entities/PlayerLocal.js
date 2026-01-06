import { BaseEntity } from './BaseEntity.js'
import { hasRank, Ranks } from '../extras/ranks.js'
import { PlayerController } from './player/PlayerController.js'
import { PlayerChatBubble } from './player/PlayerChatBubble.js'
import { PlayerInputProcessor } from './player/PlayerInputProcessor.js'
import { AnimationController } from './player/AnimationController.js'
import { NetworkSynchronizer } from './player/NetworkSynchronizer.js'
import { PlayerControlBinder } from './player/PlayerControlBinder.js'
import { PlayerAvatarManager } from './player/PlayerAvatarManager.js'
import { PlayerStateManager } from './player/PlayerStateManager.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { PlayerLocalState } from './PlayerLocalState.js'
import { PlayerLocalPhysicsBinding } from './PlayerLocalPhysicsBinding.js'
import { PlayerLocalCameraManager } from './PlayerLocalCameraManager.js'
import { PlayerLocalDelegates } from './PlayerLocalDelegates.js'
import { PlayerLocalLifecycle } from './PlayerLocalLifecycle.js'
import { PlayerLocalDestroy } from './PlayerLocalDestroy.js'

const logger = new StructuredLogger('PlayerLocal')

export class PlayerLocal extends BaseEntity {
  constructor(world, data, local) {
    logger.info('constructor called', { userId: data.userId, id: data.id })
    super(world, data, local)
    this.isPlayer = true
    this.isLocal = true
    this.avatarManager = new PlayerAvatarManager(this)
    this.stateManager = new PlayerStateManager(this)
    logger.info('Calling init()')
    this.init()
    logger.info('init() called (returns promise)')
  }

  async init() {
    try {
      this.isInitialized = false
      logger.info('init() started')

      PlayerLocalState.initializeState(this)
      PlayerLocalState.initializeSceneObjects(this)
      PlayerLocalState.initializeUINodes(this)

      this.controller = new PlayerController(this)
      this.chatBubble = new PlayerChatBubble(this)
      this.inputProcessor = new PlayerInputProcessor(this)
      this.animationController = new AnimationController(this)
      this.networkSynchronizer = new NetworkSynchronizer(this)
      this.controlBinder = new PlayerControlBinder(this)

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
      logger.info('Capsule initialized', {
        capsule: !!this.capsule,
        physics: !!this.physics,
      })

      this.controlBinder.initControl()
      logger.info('Control binding initialized')

      this.world.entities.setHot(this, true)
      this.world.setHot(this, true)
      logger.info('Player marked as hot, emitting ready event')
      this.world.events.emit('ready', true)
      this.isInitialized = true
      logger.info('init() completed')
    } catch (err) {
      logger.error('init() error', err)
      this.world.entities.setHot(this, true)
      this.world.setHot(this, true)
      this.world.events.emit('ready', true)
      this.isInitialized = true
      logger.info('Ready event emitted from catch block')
    }
  }

  initCapsule() {
    PlayerLocalPhysicsBinding.initializeCapsule(this)
  }

  getAvatarUrl() {
    return this.avatarManager.getAvatarUrl()
  }

  async applyAvatar() {
    return this.avatarManager.applyAvatar()
  }

  get cam() { return PlayerLocalDelegates.getCam(this) }
  get camHeight() { return PlayerLocalDelegates.getCamHeight(this) }
  set camHeight(value) { PlayerLocalDelegates.setCamHeight(this, value) }
  get stick() { return PlayerLocalDelegates.getStick(this) }
  set stick(value) { PlayerLocalDelegates.setStick(this, value) }
  get pan() { return PlayerLocalDelegates.getPan(this) }
  set pan(value) { PlayerLocalDelegates.setPan(this, value) }

  toggleFlying(value) {
    if (!this.physics) return
    value = typeof value === 'boolean' ? value : !this.physics.flying
    if (this.physics.flying === value) return
    this.physics.flying = value
    if (this.physics.flying) {
      const velocity = this.capsule.getLinearVelocity()
      velocity.y = 0
      this.capsule.setLinearVelocity(velocity)
    }
  }

  getAnchorMatrix() {
    return this.data.effect?.anchorId
      ? this.world.anchors.get(this.data.effect.anchorId)
      : null
  }

  _getEffectiveRank() {
    return Math.max(this.data.rank, this.world.settings.effectiveRank)
  }

  outranks(otherPlayer) {
    const otherRank = Math.max(otherPlayer.data.rank, this.world.settings.effectiveRank)
    return this._getEffectiveRank() > otherRank
  }

  isAdmin() {
    return hasRank(this._getEffectiveRank(), Ranks.ADMIN)
  }

  isBuilder() {
    return hasRank(this._getEffectiveRank(), Ranks.BUILDER)
  }

  isMuted() {
    return this.world.livekit.isMuted(this.data.id)
  }

  fixedUpdate(delta) { PlayerLocalLifecycle.fixedUpdate(this, delta) }
  update(delta) { PlayerLocalLifecycle.update(this, delta) }
  lateUpdate(delta) { PlayerLocalLifecycle.lateUpdate(this, delta) }

  teleport(...args) { return this.stateManager.teleport(...args) }
  setEffect(...args) { return this.stateManager.setEffect(...args) }
  setSpeaking(...args) { return this.stateManager.setSpeaking(...args) }
  push(...args) { return this.stateManager.push(...args) }
  setName(...args) { return this.stateManager.setName(...args) }
  setSessionAvatar(avatar) { return this.avatarManager.setSessionAvatar(avatar) }
  chat(...args) { return this.stateManager.chat(...args) }
  modify(...args) { return this.stateManager.modify(...args) }

  destroy(local) {
    PlayerLocalDestroy.destroyAll(this)
    super.destroy(local)
  }
}
