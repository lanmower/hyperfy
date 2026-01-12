import { css } from '@firebolt-dev/css'
import { LoaderIcon, XIcon } from 'lucide-react'
import { useFileUpload, fileKinds } from '../hooks/index.js'
import { useFieldHint, fieldWrapperCss, fieldLabelCss } from '../hooks/index.js'

export function FieldFile({ world, label, hint, kind: kindName, value, onChange }) {
  const hintProps = useFieldHint(hint)
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
      className='fieldfile'
      css={css`
        ${fieldWrapperCss}
        overflow: hidden;
        input {
          position: absolute;
          top: -9999px;
          left: -9999px;
          opacity: 0;
        }
        svg { line-height: 0; }
        .fieldfile-label {
          ${fieldLabelCss}
          flex: 1;
          padding-right: 1rem;
        }
        .fieldfile-placeholder { color: rgba(255, 255, 255, 0.3); }
        .fieldfile-name {
          font-size: 0.9375rem;
          text-align: right;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 9rem;
        }
        .fieldfile-x {
          line-height: 0;
          margin: 0 -0.2rem 0 0.3rem;
          color: rgba(255, 255, 255, 0.3);
          &:hover { color: white; }
        }
        .fieldfile-loading {
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
      <div className='fieldfile-label'>{label}</div>
      {!value && !loading && <div className='fieldfile-placeholder'>{kind.placeholder}</div>}
      {name && <div className='fieldfile-name'>{name}</div>}
      {value && !loading && (
        <div className='fieldfile-x'>
          <XIcon size='1rem' onClick={onRemove} />
        </div>
      )}
      {loading && (
        <div className='fieldfile-loading'>
          <LoaderIcon size='1rem' />
        </div>
      )}
      <input type='file' onChange={e => set(e.target.files[0], onChange)} accept={kind.accept} />
    </label>
  )
}
