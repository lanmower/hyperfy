import moment from 'moment'
import { uuid } from '../../utils-client.js'
import { BaseBuilderHandler } from './BaseBuilderHandler.js'
import { FileExtractor } from './FileExtractor.js'
import { EntitySpawner } from './EntitySpawner.js'
import { getFileExtension } from '../../utils/getFileExtension.js'

export class FileDropHandler extends BaseBuilderHandler {
  constructor(clientBuilder) {
    super(clientBuilder, 'FileDropHandler')
    this.dropTarget = null
    this.dropping = false
    this.fileExtractor = new FileExtractor()
    this.entitySpawner = new EntitySpawner(clientBuilder)
  }

  onDragOver = e => {
    e.preventDefault()
  }

  onDragEnter = e => {
    this.dropTarget = e.target
    this.dropping = true
  }

  onDragLeave = e => {
    if (e.target === this.dropTarget) {
      this.dropping = false
    }
  }

  onDrop = async e => {
    e.preventDefault()
    this.dropping = false

    try {
      const file = await this.fileExtractor.extractFromDrop(e)
      if (!file) return

      await new Promise(resolve => setTimeout(resolve, 100))
      const ext = getFileExtension(file.name)

      if (!this.validateFileAccess(ext, file)) return
      if (!this.validateFileSize(ext, file)) return

      if (ext !== 'vrm') {
        this.parent.toggle(true)
      }

      const transform = this.parent.getSpawnTransform()
      await this.spawnFileEntity(ext, file, transform)
    } catch (err) {
      this.logger.error('File drop failed', { error: err.message })
      this.addChatMessage(`Error: ${err.message}`)
    }
  }

  validateFileAccess(ext, file) {
    if (ext === 'vrm' && !this.parent.canBuild() && !this.parent.world.settings.customAvatars) {
      return false
    }
    if (ext !== 'vrm' && !this.parent.canBuild()) {
      this.addChatMessage(`You don't have permission to do that.`)
      return false
    }
    return true
  }

  validateFileSize(ext, file) {
    const maxUploadSize = this.parent.network.maxUploadSize
    const maxSize = maxUploadSize * 1024 * 1024
    if (file.size > maxSize) {
      this.addChatMessage(`File size too large (>${maxUploadSize}mb)`)
      this.logger.error('File too large for upload', { fileName: file.name, fileSize: file.size, maxSize })
      return false
    }
    return true
  }

  async spawnFileEntity(ext, file, transform) {
    if (ext === 'hyp') {
      await this.entitySpawner.addApp(file, transform)
    } else if (ext === 'glb') {
      await this.entitySpawner.addModel(file, transform)
    } else if (ext === 'vrm') {
      const canPlace = this.parent.canBuild()
      await this.entitySpawner.addAvatar(file, transform, canPlace)
    }
  }

  addChatMessage(body) {
    this.parent.world.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body,
      createdAt: moment().toISOString(),
    })
  }

  destroy() {
    this.dropTarget = null
  }
}
