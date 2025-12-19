import moment from 'moment'
import { uuid } from '../../utils-client.js'
import { FileExtractor } from './FileExtractor.js'
import { EntitySpawner } from './EntitySpawner.js'

export class FileDropHandler {
  constructor(clientBuilder) {
    this.clientBuilder = clientBuilder
    this.dropTarget = null
    this.dropping = false
    this.dropFile = null
    this.fileExtractor = new FileExtractor()
    this.entitySpawner = new EntitySpawner(clientBuilder)
  }

  onDragOver = e => {
    e.preventDefault()
  }

  onDragEnter = e => {
    this.dropTarget = e.target
    this.dropping = true
    this.dropFile = null
  }

  onDragLeave = e => {
    if (e.target === this.dropTarget) {
      this.dropping = false
    }
  }

  onDrop = async e => {
    e.preventDefault()
    this.dropping = false

    let file = await this.fileExtractor.extractFromDrop(e)
    if (!file) return

    await new Promise(resolve => setTimeout(resolve, 100))

    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'vrm' && !this.clientBuilder.canBuild() && !this.clientBuilder.world.settings.customAvatars) {
      return
    }

    const maxUploadSize = this.clientBuilder.network.maxUploadSize
    const maxSize = maxUploadSize * 1024 * 1024
    if (file.size > maxSize) {
      this.clientBuilder.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `File size too large (>${maxUploadSize}mb)`,
        createdAt: moment().toISOString(),
      })
      console.error(`File too large. Maximum size is ${maxUploadSize}MB`)
      return
    }

    if (ext !== 'vrm' && !this.clientBuilder.canBuild()) {
      this.clientBuilder.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `You don't have permission to do that.`,
        createdAt: moment().toISOString(),
      })
      return
    }

    if (ext !== 'vrm') {
      this.clientBuilder.toggle(true)
    }

    const transform = this.clientBuilder.getSpawnTransform()

    if (ext === 'hyp') {
      await this.entitySpawner.addApp(file, transform)
    } else if (ext === 'glb') {
      await this.entitySpawner.addModel(file, transform)
    } else if (ext === 'vrm') {
      const canPlace = this.clientBuilder.canBuild()
      await this.entitySpawner.addAvatar(file, transform, canPlace)
    }
  }
}
