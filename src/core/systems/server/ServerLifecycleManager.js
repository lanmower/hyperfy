import { FileStorage } from '../../../server/services/FileStorage.js'
import { FileUploader } from '../../../server/services/FileUploader.js'
import { CommandHandler } from '../../../server/services/CommandHandler.js'
import { WorldPersistence } from '../../../server/services/WorldPersistence.js'

const SAVE_INTERVAL = parseInt(process.env.SAVE_INTERVAL || '60')

export class ServerLifecycleManager {
  constructor(network) {
    this.network = network
  }

  init({ db, assetsDir }) {
    this.network.db = db
    this.network.fileStorage = new FileStorage(assetsDir, db)
    this.network.fileUploader = new FileUploader(
      this.network.fileStorage,
      parseInt(process.env.PUBLIC_MAX_UPLOAD_SIZE || 50 * 1024 * 1024)
    )
    this.network.commandHandler = new CommandHandler(this.network.world, db)
    this.network.persistence = new WorldPersistence(db, this.network.fileUploader)
  }

  async start() {
    this.network.spawn = JSON.parse(await this.network.persistence.loadSpawn())

    const blueprints = await this.network.persistence.loadBlueprints()
    for (const blueprint of blueprints) {
      const data = JSON.parse(blueprint.data)
      this.network.blueprints.add(data, true)
    }

    const entities = await this.network.persistence.loadEntities()
    for (const entity of entities) {
      const data = JSON.parse(entity.data)
      data.state = {}
      this.network.entities.add(data, true)
    }

    try {
      const settings = await this.network.persistence.loadSettings()
      this.network.settings.deserialize(settings)
      this.network.settings.setHasAdminCode(!!process.env.ADMIN_CODE)
    } catch (err) {
      console.error(err)
    }

    if (SAVE_INTERVAL) {
      this.network.saveTimerId = setTimeout(() => this.network.save(), SAVE_INTERVAL * 1000)
    }
  }
}
