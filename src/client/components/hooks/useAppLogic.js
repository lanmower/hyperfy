import { downloadFile } from '../../../core/extras/downloadFile.js'
import { exportApp } from '../../../core/extras/appTools.js'
import { hashFile } from '../../../core/utils-client.js'
import { isBoolean } from 'lodash-es'

const extToType = {
  glb: 'model',
  vrm: 'avatar',
}

export function useAppLogic(world) {
  const download = async blueprint => {
    try {
      const file = await exportApp(blueprint, world.loader.loadFile)
      downloadFile(file)
    } catch (err) {
      console.error(err)
    }
  }

  const changeModel = async (blueprint, file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const allowedModels = ['glb', 'vrm']
    if (!allowedModels.includes(ext)) return
    const hash = await hashFile(file)
    const filename = `${hash}.${ext}`
    const url = `asset://${filename}`
    const type = extToType[ext]
    world.loader.insert(type, url, file)
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, model: url })
    await world.network.upload(file)
    world.network.send('blueprintModified', { id: blueprint.id, version, model: url })
  }

  const toggleBlueprintKey = (blueprint, key, value) => {
    value = isBoolean(value) ? value : !blueprint[key]
    if (blueprint[key] === value) return
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, [key]: value })
    world.network.send('blueprintModified', { id: blueprint.id, version, [key]: value })
  }

  const toggleEntityPinned = entity => {
    const pinned = !entity.data.pinned
    entity.data.pinned = pinned
    world.network.send('entityModified', { id: entity.data.id, pinned })
    return pinned
  }

  return {
    download,
    changeModel,
    toggleBlueprintKey,
    toggleEntityPinned,
  }
}
