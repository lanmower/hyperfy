import { FileStorage } from '../../../server/services/FileStorage.js'
import { FileUploader } from '../../../server/services/FileUploader.js'
import { CommandHandler } from '../../../server/services/CommandHandler.js'
import { WorldPersistence } from '../../../server/services/WorldPersistence.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ServerLifecycleManager')
const env = typeof process !== 'undefined' && process.env ? process.env : {}
const SAVE_INTERVAL = parseInt(env.SAVE_INTERVAL || '60', 10)

export class ServerLifecycleManager {
  constructor(network) {
    this.network = network
  }

  init({ db, assetsDir }) {
    this.network.db = db
    this.network.fileStorage = new FileStorage(assetsDir, db)
    this.network.fileUploader = new FileUploader(
      this.network.fileStorage,
      parseInt(env.PUBLIC_MAX_UPLOAD_SIZE || 50 * 1024 * 1024, 10)
    )
    this.network.commandHandler = new CommandHandler(this.network.world, db)
    this.network.persistence = new WorldPersistence(db, this.network.fileUploader)
  }

  async start() {
    this.network.spawn = JSON.parse(await this.network.persistence.loadSpawn())

    const dbBlueprints = await this.network.persistence.loadBlueprints()
    for (const blueprint of dbBlueprints) {
      const data = JSON.parse(blueprint.data)
      this.network.blueprints.add(data, true)
    }

    const collections = this.network.world.collections.values?.() || []
    for (const collection of collections) {
      for (const blueprint of collection.blueprints || []) {
        const existingBlueprint = this.network.blueprints.get(blueprint.id)
        if (!existingBlueprint) {
          logger.info('Adding blueprint from collection', { blueprintId: blueprint.id })
          this.network.blueprints.add(blueprint, true)
        }
      }
    }

    const sceneBlueprint = this.network.blueprints.getScene()
    const sceneEntityId = sceneBlueprint ? 'scene-' + Date.now() : null
    const sceneEntity = sceneBlueprint ? {
      id: sceneEntityId,
      type: 'app',
      blueprint: '$scene',
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      scale: [1, 1, 1],
      userId: null,
    } : null

    const entities = await this.network.persistence.loadEntities()
    const entityIds = new Set(entities.map(e => {
      const data = JSON.parse(e.data)
      return data.id
    }))

    for (const entity of entities) {
      const data = JSON.parse(entity.data)
      data.state = {}
      try {
        this.network.entities.add(data, true)
      } catch (err) {
        logger.error('Failed to add entity', { entityId: data.id, error: err.message })
      }
    }

    if (sceneEntity && !entityIds.has(sceneEntityId)) {
      logger.info('Creating and adding scene entity', { sceneEntityId })
      try {
        this.network.entities.add(sceneEntity, true)
        const meadowBlueprint = this.network.blueprints.get('1gBgzpneVh')
        if (meadowBlueprint) {
          const meadowId = 'meadow-' + Date.now()
          const meadowEntity = {
            id: meadowId,
            type: 'app',
            blueprint: '1gBgzpneVh',
            position: [0, 0, 0],
            quaternion: [0, 0, 0, 1],
            scale: [1, 1, 1],
            userId: null,
          }
          logger.info('Creating meadow app entity', { meadowId })
          this.network.entities.add(meadowEntity, true)
        }
      } catch (err) {
        logger.error('Failed to add scene entity', { error: err.message })
      }
    }

    try {
      const settings = await this.network.persistence.loadSettings()
      this.network.settings.deserialize(settings)
      this.network.settings.setHasAdminCode(!!env.ADMIN_CODE)
    } catch (err) {
      logger.error('Failed to load settings', { error: err.message })
    }

    if (SAVE_INTERVAL) {
      this.network.saveTimerId = setTimeout(() => this.network.save(), SAVE_INTERVAL * 1000)
    }
  }
}
