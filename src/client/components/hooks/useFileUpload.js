import { useRef, useState } from 'react'
import { hashFile } from '../../../core/utils-client.js'
import { downloadFile } from '../../../core/extras/downloadFile.js'
import { useUpdate } from '../../useUpdate.js'

export const fileKinds = {
  avatar: { type: 'avatar', accept: '.vrm', exts: ['vrm'], placeholder: 'vrm' },
  emote: { type: 'emote', accept: '.glb', exts: ['glb'], placeholder: 'glb' },
  model: { type: 'model', accept: '.glb', exts: ['glb'], placeholder: 'glb' },
  texture: { type: 'texture', accept: '.jpg,.jpeg,.png,.webp', exts: ['jpg', 'jpeg', 'png', 'webp'], placeholder: 'jpg,png,webp' },
  image: { type: 'image', accept: '.jpg,.jpeg,.png,.webp', exts: ['jpg', 'jpeg', 'png', 'webp'], placeholder: 'jpg,png,webp' },
  video: { type: 'video', accept: '.mp4', exts: ['mp4'], placeholder: 'mp4' },
  hdr: { type: 'hdr', accept: '.hdr', exts: ['hdr'], placeholder: 'hdr' },
  audio: { type: 'audio', accept: '.mp3', exts: ['mp3'], placeholder: 'mp3' },
}

export function useFileUpload(world, kindName) {
  const nRef = useRef(0)
  const update = useUpdate()
  const [loading, setLoading] = useState(null)
  const kind = fileKinds[kindName]

  const set = async (file, onChange) => {
    if (!file) return
    const n = ++nRef.current
    update()

    const ext = file.name.split('.').pop().toLowerCase()
    if (!kind.exts.includes(ext)) {
      console.error(`attempted invalid file extension for ${kindName}: ${ext}`)
      return
    }

    const hash = await hashFile(file)
    const filename = `${hash}.${ext}`
    const url = `asset://${filename}`
    const newValue = {
      type: kind.type,
      name: file.name,
      url,
    }

    setLoading(newValue)
    await world.network.upload(file)
    if (nRef.current !== n) return

    world.loader.insert(kind.type, url, file)
    setLoading(null)
    onChange(newValue)
  }

  const remove = (onChange) => {
    onChange(null)
  }

  const handleDownload = async (value) => {
    if (!value?.url) return
    if (!world.loader.hasFile(value.url)) {
      await world.loader.loadFile(value.url)
    }
    const file = world.loader.getFile(value.url, value.name)
    if (!file) return console.error('could not load file')
    downloadFile(file)
  }

  return {
    kind,
    loading,
    set,
    remove,
    handleDownload,
  }
}
