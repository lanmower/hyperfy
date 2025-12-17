import { useContext, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { LoaderIcon, XIcon } from 'lucide-react'
import { hashFile } from '../../core/utils-client.js'
import { downloadFile } from '../../core/extras/downloadFile.js'
import { useUpdate } from '../useUpdate.js'
import { MenuContext } from './Menu.js'

export const fileKinds = {
  avatar: {
    type: 'avatar',
    accept: '.vrm',
    exts: ['vrm'],
    placeholder: 'vrm',
  },
  emote: {
    type: 'emote',
    accept: '.glb',
    exts: ['glb'],
    placeholder: 'glb',
  },
  model: {
    type: 'model',
    accept: '.glb',
    exts: ['glb'],
    placeholder: 'glb',
  },
  texture: {
    type: 'texture',
    accept: '.jpg,.jpeg,.png,.webp',
    exts: ['jpg', 'jpeg', 'png', 'webp'],
    placeholder: 'jpg,png,webp',
  },
  image: {
    type: 'image',
    accept: '.jpg,.jpeg,.png,.webp',
    exts: ['jpg', 'jpeg', 'png', 'webp'],
    placeholder: 'jpg,png,webp',
  },
  video: {
    type: 'video',
    accept: '.mp4',
    exts: ['mp4'],
    placeholder: 'mp4',
  },
  hdr: {
    type: 'hdr',
    accept: '.hdr',
    exts: ['hdr'],
    placeholder: 'hdr',
  },
  audio: {
    type: 'audio',
    accept: '.mp3',
    exts: ['mp3'],
    placeholder: 'mp3',
  },
}

export function MenuItemFile({ world, label, hint, kind: kindName, value, onChange }) {
  const setHint = useContext(MenuContext)
  const nRef = useRef(0)
  const update = useUpdate()
  const [loading, setLoading] = useState(null)
  const kind = fileKinds[kindName]
  if (!kind) return null
  const set = async e => {
    const n = ++nRef.current
    update()
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!kind.exts.includes(ext)) {
      return console.error(`attempted invalid file extension for ${kindName}: ${ext}`)
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
  const remove = e => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }
  const handleDownload = async e => {
    if (e.shiftKey && value?.url) {
      e.preventDefault()
      if (!world.loader.hasFile(value.url)) {
        await world.loader.loadFile(value.url)
      }
      const file = world.loader.getFile(value.url, value.name)
      if (!file) return console.error('could not load file')
      downloadFile(file)
    }
  }
  const n = nRef.current
  const name = loading?.name || value?.name
  return (
    <label
      className='menuitemfile'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg {
          line-height: 0;
        }
        .menuitemfile-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemfile-placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        .menuitemfile-name {
          text-align: right;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 9rem;
        }
        .menuitemfile-x {
          line-height: 0;
          margin: 0 -0.2rem 0 0.3rem;
          color: rgba(255, 255, 255, 0.3);
          &:hover {
            color: white;
          }
        }
        .menuitemfile-loading {
          margin: 0 -0.1rem 0 0.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          svg {
            animation: spin 1s linear infinite;
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
      onClick={handleDownload}
    >
      <div className='menuitemfile-label'>{label}</div>
      {!value && !loading && <div className='menuitemfile-placeholder'>{kind.placeholder}</div>}
      {name && <div className='menuitemfile-name'>{name}</div>}
      {value && !loading && (
        <div className='menuitemfile-x'>
          <XIcon size='1rem' onClick={remove} />
        </div>
      )}
      {loading && (
        <div className='menuitemfile-loading'>
          <LoaderIcon size='1rem' />
        </div>
      )}
      <input key={n} type='file' onChange={set} accept={kind.accept} />
    </label>
  )
}
