import { css } from '@firebolt-dev/css'
import { useRef, useState } from 'react'
import { FileIcon, LoaderIcon, XIcon } from 'lucide-react'
import { hashFile } from '../../../core/utils-client.js'
import { useUpdate } from '../useUpdate.js'

export const fileKinds = {
  avatar: {
    type: 'avatar',
    accept: '.vrm',
    exts: ['vrm'],
    placeholder: '.vrm',
  },
  emote: {
    type: 'emote',
    accept: '.glb',
    exts: ['glb'],
    placeholder: '.glb',
  },
  model: {
    type: 'model',
    accept: '.glb',
    exts: ['glb'],
    placeholder: '.glb',
  },
  texture: {
    type: 'texture',
    accept: '.jpg,.jpeg,.png,.webp',
    exts: ['jpg', 'jpeg', 'png', 'webp'],
    placeholder: '.jpg / .png / .webp',
  },
  hdr: {
    type: 'hdr',
    accept: '.hdr',
    exts: ['hdr'],
    placeholder: '.hdr',
  },
  audio: {
    type: 'audio',
    accept: '.mp3',
    exts: ['mp3'],
    placeholder: '.mp3',
  },
}

export function InputFile({ world, kind: kindName, value, onChange }) {
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
  const n = nRef.current
  const label = loading?.name || value?.name
  return (
    <label
      className='inputfile'
      css={css`
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        height: 34px;
        background-color: #252630;
        border-radius: 10px;
        padding: 0 0 0 8px;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg {
          line-height: 0;
        }
        .inputfile-placeholder {
          flex: 1;
          font-size: 14px;
          padding: 0 5px;
          color: rgba(255, 255, 255, 0.5);
        }
        .inputfile-name {
          flex: 1;
          font-size: 14px;
          padding: 0 5px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .inputfile-x {
          width: 30px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .inputfile-loading {
          width: 30px;
          height: 34px;
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
      `}
    >
      <FileIcon size={14} />
      {!value && !loading && <div className='inputfile-placeholder'>{kind.placeholder}</div>}
      {label && <div className='inputfile-name'>{label}</div>}
      {value && !loading && (
        <div className='inputfile-x'>
          <XIcon size={14} onClick={remove} />
        </div>
      )}
      {loading && (
        <div className='inputfile-loading'>
          <LoaderIcon size={14} />
        </div>
      )}
      <input key={n} type='file' onChange={set} accept={kind.accept} />
    </label>
  )
}
