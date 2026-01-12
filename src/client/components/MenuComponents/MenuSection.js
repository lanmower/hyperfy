import { css } from '@firebolt-dev/css'

export function MenuSection({ label }) {
  return (
    <div
      className='menusection'
      css={css`
        display: flex;
        align-items: center;
        height: 1.875rem;
        padding: 0 0.825rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(255, 255, 255, 0.3);
        text-overflow: ellipsis;
        overflow: hidden;
      `}
    >
      {label}
    </div>
  )
}
