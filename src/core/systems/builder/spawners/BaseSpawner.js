import { uuid } from '../../../utils-client.js'
import { StructuredLogger } from '../../../utils/logging/index.js'
import { BlueprintFactory } from '../../../factories/BlueprintFactory.js'
import { NetworkUploadUtil } from '../../../utils/network/NetworkUploadUtil.js'

export class BaseSpawner {
  constructor(entitySpawner) {
    this.entitySpawner = entitySpawner
    this.clientBuilder = entitySpawner.clientBuilder
    this.logger = new StructuredLogger(this.constructor.name)
  }

  createBlueprint(overrides = {}) {
    return BlueprintFactory.createBlueprint('app', overrides)
  }

  createEntityData(blueprintId, transform = {}, overrides = {}) {
    const defaults = {
      id: uuid(),
      type: 'app',
      blueprint: blueprintId,
      position: transform.position || [0, 0, 0],
      quaternion: transform.quaternion || [0, 0, 0, 1],
      scale: transform.scale || [1, 1, 1],
      mover: null,
      uploader: this.clientBuilder.network.id,
      pinned: false,
      state: {},
    }
    return { ...defaults, ...overrides }
  }

  async handleUploadWithRollback(files, entity) {
    try {
      const result = await NetworkUploadUtil.uploadBatch(this.clientBuilder.network, files, {
        onRetry: (f, attempt) => this.logger.warn('Upload retry', { file: f.name, attempt })
      })
      if (result.failed.length > 0) {
        throw new Error(`${result.failed.length} file(s) failed to upload`)
      }
      entity.onUploaded()
    } catch (err) {
      this.logger.error('Asset upload failed', { error: err.message })
      entity.destroy()
      throw err
    }
  }
}
