import { useContext } from 'react'
import { css } from '@firebolt-dev/css'
import { MenuContext } from './Menu.js'

export function MenuItemToggle({ label, hint, trueLabel = 'Yes', falseLabel = 'No', value, onChange }) {
  const setHint = useContext(MenuContext)
  return (
    <div
      className='menuitemtoggle'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemtoggle-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemtoggle-text {
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
      onClick={() => onChange(!value)}
    >
      <div className='menuitemtoggle-label'>{label}</div>
      <div className='menuitemtoggle-text'>{value ? trueLabel : falseLabel}</div>
    </div>
  )
}
