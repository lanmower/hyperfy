import { useContext } from 'react'
import { css } from '@firebolt-dev/css'
import { ChevronRightIcon } from '../Icons.js'
import { MenuContext } from './Menu.js'

export function MenuItemSwitch({ label, hint, options, value, onChange }) {
  const setHint = useContext(MenuContext)
  options = options || []
  const idx = options.findIndex(o => o.value === value)
  const selected = options[idx]
  const prev = () => {
    let nextIdx = idx - 1
    if (nextIdx < 0) nextIdx = options.length - 1
    onChange(options[nextIdx].value)
  }
  const next = () => {
    let nextIdx = idx + 1
    if (nextIdx > options.length - 1) nextIdx = 0
    onChange(options[nextIdx].value)
  }
  return (
    <div
      className='menuitemswitch'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemswitch-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemswitch-btn {
          width: 2.125rem;
          height: 2.125rem;
          display: none;
          align-items: center;
          justify-content: center;
          opacity: 0.2;
          &:hover {
            cursor: pointer;
            opacity: 1;
          }
        }
        .menuitemswitch-text {
          line-height: 1;
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          .menuitemswitch-btn {
            display: flex;
          }
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='menuitemswitch-label'>{label}</div>
      <div className='menuitemswitch-btn left' onClick={prev}>
        <ChevronRightIcon size='1.5rem' style={{ transform: 'rotate(180deg)' }} />
      </div>
      <div className='menuitemswitch-text'>{selected?.label || '???'}</div>
      <div className='menuitemswitch-btn right' onClick={next}>
        <ChevronRightIcon size='1.5rem' />
      </div>
    </div>
  )
}
