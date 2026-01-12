import { css } from '@firebolt-dev/css'
import { FileIcon, LoaderIcon, XIcon } from 'lucide-react'
import { useFileUpload } from '../hooks/index.js'

export function InputFile({ world, kind: kindName, value, onChange }) {
  const { kind, loading, set, remove } = useFileUpload(world, kindName)

  if (!kind) return null

  const label = loading?.name || value?.name

  const onRemove = e => {
    e.preventDefault()
    e.stopPropagation()
    remove(onChange)
  }

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
        svg { line-height: 0; }
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
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          svg { animation: spin 1s linear infinite; }
        }
      `}
    >
      <FileIcon size={14} />
      {!value && !loading && <div className='inputfile-placeholder'>{kind.placeholder}</div>}
      {label && <div className='inputfile-name'>{label}</div>}
      {value && !loading && (
        <div className='inputfile-x'>
          <XIcon size={14} onClick={onRemove} />
        </div>
      )}
      {loading && (
        <div className='inputfile-loading'>
          <LoaderIcon size={14} />
        </div>
      )}
      <input type='file' onChange={e => set(e.target.files[0], onChange)} accept={kind.accept} />
    </label>
  )
}
