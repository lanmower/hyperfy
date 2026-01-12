import { css } from '@firebolt-dev/css'
import { useContext } from 'react'
import { HintContext } from '../Hint.js'
import { ChevronRightIcon } from '../Icons.js'

export function FieldBtn({ label, note, hint, nav, onClick }) {
  const { setHint } = useContext(HintContext)
  return (
    <div
      className='fieldbtn'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        .fieldbtn-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldbtn-note {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.4);
        }
        &:hover {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
      onClick={onClick}
    >
      <div className='fieldbtn-label'>{label}</div>
      {note && <div className='fieldbtn-note'>{note}</div>}
      {nav && <ChevronRightIcon size='1.5rem' />}
    </div>
  )
}
