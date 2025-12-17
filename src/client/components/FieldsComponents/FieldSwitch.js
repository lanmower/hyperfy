import { css } from '@firebolt-dev/css'
import { useContext } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../../Icons.js'
import { HintContext } from '../../Hint.js'

export function FieldSwitch({ label, hint, options, value, onChange }) {
  options = options || []
  const { setHint } = useContext(HintContext)
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
      className='fieldswitch'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        .fieldswitch-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldswitch-btn {
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
        .fieldswitch-text {
          font-size: 0.9375rem;
          line-height: 1;
        }
        &:hover {
          padding: 0 0.275rem 0 1rem;
          background-color: rgba(255, 255, 255, 0.03);
          .fieldswitch-btn {
            display: flex;
          }
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='fieldswitch-label'>{label}</div>
      <div className='fieldswitch-btn left' onClick={prev}>
        <ChevronLeftIcon size='1.5rem' />
      </div>
      <div className='fieldswitch-text'>{selected?.label || '???'}</div>
      <div className='fieldswitch-btn right' onClick={next}>
        <ChevronRightIcon size='1.5rem' />
      </div>
    </div>
  )
}
