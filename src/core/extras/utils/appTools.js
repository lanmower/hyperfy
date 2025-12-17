import { cloneDeep } from 'lodash-es'

export async function exportApp(blueprint, resolveFile) {
  blueprint = cloneDeep(blueprint)

  const assets = []
  if (blueprint.model) {
    assets.push({
      type: blueprint.model.endsWith('.vrm') ? 'avatar' : 'model',
      url: blueprint.model,
      file: await resolveFile(blueprint.model),
    })
  }
  if (blueprint.script) {
    assets.push({
      type: 'script',
      url: blueprint.script,
      file: await resolveFile(blueprint.script),
    })
  }
  if (blueprint.image) {
    assets.push({
      type: 'texture',
      url: blueprint.image.url,
      file: await resolveFile(blueprint.image.url),
    })
  }
  for (const key in blueprint.props) {
    const value = blueprint.props[key]
    if (value?.url) {
      assets.push({
        type: value.type,
        url: value.url,
        file: await resolveFile(value.url),
      })
    }
  }

  if (blueprint.locked) {
    blueprint.frozen = true
  }
  if (blueprint.disabled) {
    blueprint.disabled = false
  }

  const filename = `${blueprint.name || 'app'}.hyp`

  const header = {
    blueprint,
    assets: assets.map(asset => {
      return {
        type: asset.type,
        url: asset.url,
        size: asset.file.size,
        mime: asset.file.type,
      }
    }),
  }

  const headerBytes = new TextEncoder().encode(JSON.stringify(header))

  const headerSize = new Uint8Array(4)
  new DataView(headerSize.buffer).setUint32(0, headerBytes.length, true)

  const fileBlobs = await Promise.all(assets.map(asset => asset.file.arrayBuffer()))

  const file = new File([headerSize, headerBytes, ...fileBlobs], filename, {
    type: 'application/octet-stream',
  })

  return file
}

export async function importApp(file) {
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  const headerSize = view.getUint32(0, true)

  const bytes = new Uint8Array(buffer.slice(4, 4 + headerSize))
  const header = JSON.parse(new TextDecoder().decode(bytes))

  let position = 4 + headerSize
  const assets = []

  for (const assetInfo of header.assets) {
    const data = buffer.slice(position, position + assetInfo.size)
    const file = new File([data], assetInfo.url.split('/').pop(), {
      type: assetInfo.mime,
    })
    assets.push({
      type: assetInfo.type,
      url: assetInfo.url,
      file,
    })
    position += assetInfo.size
  }

  return {
    blueprint: header.blueprint,
    assets,
  }
}
