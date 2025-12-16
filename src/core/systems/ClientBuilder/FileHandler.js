// ClientBuilder file handling (drag-drop, imports)

import { importApp } from '../../extras/appTools.js'
import { uuid } from '../../utils.js'

export class BuilderFileHandler {
  constructor(builder) {
    this.builder = builder
  }

  init() {
    document.addEventListener('dragover', (e) => this.onDragOver(e))
    document.addEventListener('drop', (e) => this.onDrop(e))
  }

  onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  async onDrop(e) {
    e.preventDefault()
    const files = e.dataTransfer.files
    for (const file of files) {
      await this.handleFile(file)
    }
  }

  async handleFile(file) {
    try {
      const content = await file.text()
      await this.importBlueprint(content, file.name)
    } catch (err) {
      console.error('Failed to import file:', err)
    }
  }

  async importBlueprint(content, filename) {
    try {
      const data = JSON.parse(content)
      const id = uuid()

      // Add blueprint to world
      const blueprint = {
        id,
        name: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        ...data,
      }

      this.builder.world.blueprints.add(blueprint)
    } catch (err) {
      console.error('Invalid blueprint JSON:', err)
    }
  }

  destroy() {
    document.removeEventListener('dragover', (e) => this.onDragOver(e))
    document.removeEventListener('drop', (e) => this.onDrop(e))
  }
}
