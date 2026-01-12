import { useContext, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { LoaderIcon, XIcon } from 'lucide-react'
import { hashFile } from '../../core/utils-client.js'
import { useUpdate } from '../useUpdate.js'
import { MenuContext } from './Menu.js'

export function MenuItemFileBtn({ label, hint, accept, value, onChange }) {
  const setHint = useContext(MenuContext)
  const nRef = useRef(0)
  const update = useUpdate()
  const [loading, setLoading] = useState(null)
  const set = async e => {
    const n = ++nRef.current
    update()
    const file = e.target.files[0]
    if (!file) return
    const hash = await hashFile(file)
    const filename = `${hash}.${file.name.split('.').pop()}`
    const url = `asset://${filename}`
    const newValue = {
      name: file.name,
      url,
    }
    setLoading(newValue)
    setLoading(null)
    onChange(newValue)
  }
  const remove = e => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }
  const n = nRef.current
  const name = loading?.name || value?.name
  return (
    <label
      className='menuitemfilebtn'
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
        .menuitemfilebtn-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemfilebtn-name {
          text-align: right;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 9rem;
        }
        .menuitemfilebtn-x {
          line-height: 0;
          margin: 0 -0.2rem 0 0.3rem;
          color: rgba(255, 255, 255, 0.3);
          &:hover {
            color: white;
          }
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemfilebtn-label'>{label}</div>
      {name && <div className='menuitemfilebtn-name'>{name}</div>}
      {value && !loading && (
        <div className='menuitemfilebtn-x'>
          <XIcon size='1rem' onClick={remove} />
        </div>
      )}
      {loading && (
        <div>
          <LoaderIcon size='1rem' />
        </div>
      )}
      <input key={n} type='file' onChange={set} accept={accept} />
    </label>
  )
}
