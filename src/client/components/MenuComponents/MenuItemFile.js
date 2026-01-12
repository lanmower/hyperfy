import { css } from '@firebolt-dev/css'
import { LoaderIcon, XIcon } from 'lucide-react'
import { useFileUpload } from '../hooks/index.js'
import { useMenuHint, menuWrapperCss } from '../hooks/index.js'

export function MenuItemFile({ world, label, hint, kind: kindName, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const { kind, loading, set, remove, handleDownload } = useFileUpload(world, kindName)

  if (!kind) return null

  const name = loading?.name || value?.name

  const onRemove = e => {
    e.preventDefault()
    e.stopPropagation()
    remove(onChange)
  }

  const onDownload = async e => {
    if (e.shiftKey && value?.url) {
      e.preventDefault()
      await handleDownload(value)
    }
  }

  return (
    <label
      className='menuitemfile'
      css={css`
        ${menuWrapperCss}
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg { line-height: 0; }
        .menuitemfile-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemfile-placeholder { color: rgba(255, 255, 255, 0.3); }
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
          &:hover { color: white; }
        }
        .menuitemfile-loading {
          margin: 0 -0.1rem 0 0.3rem;
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
      {...hintProps}
      onClick={onDownload}
    >
      <div className='menuitemfile-label'>{label}</div>
      {!value && !loading && <div className='menuitemfile-placeholder'>{kind.placeholder}</div>}
      {name && <div className='menuitemfile-name'>{name}</div>}
      {value && !loading && (
        <div className='menuitemfile-x'>
          <XIcon size='1rem' onClick={onRemove} />
        </div>
      )}
      {loading && (
        <div className='menuitemfile-loading'>
          <LoaderIcon size='1rem' />
        </div>
      )}
      <input type='file' onChange={e => set(e.target.files[0], onChange)} accept={kind.accept} />
    </label>
  )
}
