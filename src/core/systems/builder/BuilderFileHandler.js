
import moment from 'moment'
import { uuid } from '../../utils.js'

export class BuilderFileHandler {
  constructor(world, builder, entityCreator) {
    this.world = world
    this.builder = builder
    this.entityCreator = entityCreator
    this.settings = world.settings
    this.network = world.network
    this.chat = world.chat
    this.dropTarget = null
    this.dropping = false
    this.file = null
  }

  onDragOver = e => {
    e.preventDefault()
  }

  onDragEnter = e => {
    this.dropTarget = e.target
    this.dropping = true
    this.file = null
  }

  onDragLeave = e => {
    if (e.target === this.dropTarget) {
      this.dropping = false
    }
  }

  onDrop = async e => {
    e.preventDefault()
    this.dropping = false

    let file = await this._extractFileFromDrop(e)
    if (!file) return

    await new Promise(resolve => setTimeout(resolve, 100))

    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'vrm' && !this.builder.canBuild() && !this.settings.customAvatars) {
      return
    }

    const maxSize = this.network.maxUploadSize * 1024 * 1024
    if (file.size > maxSize) {
      this.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `File size too large (>${this.network.maxUploadSize}mb)`,
        createdAt: moment().toISOString(),
      })
      console.error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    if (ext !== 'vrm' && !this.builder.canBuild()) {
      this.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `You don't have permission to do that.`,
        createdAt: moment().toISOString(),
      })
      return
    }

    if (ext !== 'vrm') {
      this.builder.toggle(true)
    }

    const transform = this.entityCreator.getSpawnTransform()

    if (ext === 'hyp') {
      await this.entityCreator.addApp(file, transform)
    } else if (ext === 'glb') {
      await this.entityCreator.addModel(file, transform)
    } else if (ext === 'vrm') {
      const canPlace = this.builder.canBuild()
      await this.entityCreator.addAvatar(file, transform, canPlace)
    }
  }

  async _extractFileFromDrop(e) {
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]

      if (item.kind === 'file') {
        return item.getAsFile()
      }

      if (item.type === 'text/uri-list' || item.type === 'text/plain' || item.type === 'text/html') {
        const text = await this._getAsString(item)
        const url = text.trim().split('\n')[0] // First line

        if (url.startsWith('http')) {
          try {
            const resp = await fetch(url)
            const blob = await resp.blob()
            const filename = new URL(url).pathname.split('/').pop()
            return new File([blob], filename, { type: resp.headers.get('content-type') })
          } catch (err) {
            console.error('Failed to fetch URL:', err)
            return null
          }
        }
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      return e.dataTransfer.files[0]
    }

    return null
  }

  _getAsString(item) {
    return new Promise(resolve => {
      item.getAsString(resolve)
    })
  }
}
