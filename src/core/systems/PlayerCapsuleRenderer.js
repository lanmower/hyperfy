import * as pc from '../extras/playcanvas.js'
import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('PlayerCapsuleRenderer')

export class PlayerCapsuleRenderer extends System {
  static DEPS = {
    graphics: 'graphics',
    entities: 'entities',
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.playerMeshes = new Map()
  }

  init() {
    if (!this.world.isClient) return
    logger.info('PlayerCapsuleRenderer.init() - listening for entity.added')
    this.events.on('entity.added', (entity) => {
      logger.info('entity.added event', { isPlayer: entity.isPlayer, hasApp: !!this.world.graphics.app, entityId: entity.data?.id })
      if (entity.isPlayer && this.world.graphics.app) {
        this.createPlayerCapsule(entity)
      }
    })
  }

  createPlayerCapsule(player) {
    if (this.playerMeshes.has(player.data.id)) return
    if (!this.world.graphics.app) return

    const app = this.world.graphics.app
    if (!app.graphicsDevice) {
      logger.warn('Graphics device not ready for player capsule', { playerId: player.data.id })
      return
    }

    const capsuleEntity = new pc.Entity(`player-${player.data.id}`)

    const pos = player.data.position || [0, 0, 0]
    capsuleEntity.setLocalPosition(pos[0], pos[1], pos[2])

    const radius = 0.3
    const height = 1.2
    const mesh = pc.createCapsule(app.graphicsDevice, { radius, height })

    const material = new pc.StandardMaterial()
    material.diffuse.set(0.2, 0.5, 0.8)
    material.metalness = 0.1
    material.roughness = 0.7
    material.update()

    const meshInstance = new pc.MeshInstance(mesh, material)
    capsuleEntity.addComponent('render', {
      type: 'asset',
      meshInstances: [meshInstance]
    })

    app.root.addChild(capsuleEntity)
    this.playerMeshes.set(player.data.id, capsuleEntity)
    logger.info('Player capsule created', { playerId: player.data.id })
  }

  update(delta) {
    for (const [playerId, entity] of this.playerMeshes) {
      const player = this.entities.players.get(playerId)
      if (player && player.data.position) {
        const pos = player.data.position
        entity.setLocalPosition(pos[0], pos[1], pos[2])
      }
    }
  }

  destroy() {
    for (const entity of this.playerMeshes.values()) {
      entity.destroy()
    }
    this.playerMeshes.clear()
  }
}
