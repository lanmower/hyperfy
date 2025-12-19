import { downloadFile } from '../../../core/extras/downloadFile.js'
import { exportApp } from '../../../core/extras/appTools.js'
import { hashFile } from '../../../core/utils-client.js'
import { isBoolean } from 'lodash-es'

const extToType = {
  glb: 'model',
  vrm: 'avatar',
}

export class AppLogic {
  constructor(world) {
    this.world = world
  }

  async download(blueprint) {
    try {
      const file = await exportApp(blueprint, this.world.loader.loadFile)
      downloadFile(file)
    } catch (err) {
      console.error(err)
    }
  }

  async changeModel(blueprint, file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const allowedModels = ['glb', 'vrm']
    if (!allowedModels.includes(ext)) return
    const hash = await hashFile(file)
    const filename = `${hash}.${ext}`
    const url = `asset://${filename}`
    const type = extToType[ext]
    this.world.loader.insert(type, url, file)
    const version = blueprint.version + 1
    this.world.blueprints.modify({ id: blueprint.id, version, model: url })
    await this.world.network.upload(file)
    this.world.network.send('blueprintModified', { id: blueprint.id, version, model: url })
  }

  toggleBlueprintKey(blueprint, key, value) {
    value = isBoolean(value) ? value : !blueprint[key]
    if (blueprint[key] === value) return
    const version = blueprint.version + 1
    this.world.blueprints.modify({ id: blueprint.id, version, [key]: value })
    this.world.network.send('blueprintModified', { id: blueprint.id, version, [key]: value })
  }

  toggleEntityPinned(entity) {
    const pinned = !entity.data.pinned
    entity.data.pinned = pinned
    this.world.network.send('entityModified', { id: entity.data.id, pinned })
    return pinned
  }
}
