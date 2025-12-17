import { css } from '@firebolt-dev/css'
import { useContext } from 'react'
import { HintContext } from '../../Hint.js'

export function FieldToggle({ label, hint, trueLabel = 'Yes', falseLabel = 'No', value, onChange }) {
  const { setHint } = useContext(HintContext)
  return (
    <div
      className='fieldtoggle'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        .fieldtoggle-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldtoggle-text {
          font-size: 0.9375rem;
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
      onClick={() => onChange(!value)}
    >
      <div className='fieldtoggle-label'>{label}</div>
      <div className='fieldtoggle-text'>{value ? trueLabel : falseLabel}</div>
    </div>
  )
}
