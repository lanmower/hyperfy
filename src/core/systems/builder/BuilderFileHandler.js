/**
 * Builder File Handler
 *
 * Handles file drag-and-drop operations for importing assets.
 * Responsibilities:
 * - Drag over/enter/leave event handling
 * - File extraction and validation
 * - Permission and size checking
 * - Routing to appropriate import handler
 */

import moment from 'moment'
import { uuid } from '../../utils.js'

export class BuilderFileHandler {
  constructor(world, builder, entityCreator) {
    this.world = world
    this.builder = builder
    this.entityCreator = entityCreator
    this.dropTarget = null
    this.dropping = false
    this.file = null
  }

  /**
   * Handle drag over event
   */
  onDragOver = e => {
    e.preventDefault()
  }

  /**
   * Handle drag enter event
   */
  onDragEnter = e => {
    this.dropTarget = e.target
    this.dropping = true
    this.file = null
  }

  /**
   * Handle drag leave event
   */
  onDragLeave = e => {
    if (e.target === this.dropTarget) {
      this.dropping = false
    }
  }

  /**
   * Handle file drop
   */
  onDrop = async e => {
    e.preventDefault()
    this.dropping = false

    // Extract file from drop event
    let file = await this._extractFileFromDrop(e)
    if (!file) return

    // Small delay to ensure pointer position is updated
    await new Promise(resolve => setTimeout(resolve, 100))

    // Get file extension
    const ext = file.name.split('.').pop().toLowerCase()

    // Check VRM permissions
    if (ext === 'vrm' && !this.builder.canBuild() && !this.world.settings.customAvatars) {
      return
    }

    // Validate file size
    const maxSize = this.world.network.maxUploadSize * 1024 * 1024
    if (file.size > maxSize) {
      this.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `File size too large (>${this.world.network.maxUploadSize}mb)`,
        createdAt: moment().toISOString(),
      })
      console.error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    // Check builder permission for non-VRM files
    if (ext !== 'vrm' && !this.builder.canBuild()) {
      this.world.chat.add({
        id: uuid(),
        from: null,
        fromId: null,
        body: `You don't have permission to do that.`,
        createdAt: moment().toISOString(),
      })
      return
    }

    // Switch to build mode if needed
    if (ext !== 'vrm') {
      this.builder.toggle(true)
    }

    // Get spawn transform and route to appropriate handler
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

  /**
   * Extract file from drop event (handles files, URLs, text)
   */
  async _extractFileFromDrop(e) {
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]

      // Handle file
      if (item.kind === 'file') {
        return item.getAsFile()
      }

      // Handle URLs and text
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

  /**
   * Get text from drag item
   */
  _getAsString(item) {
    return new Promise(resolve => {
      item.getAsString(resolve)
    })
  }
}
