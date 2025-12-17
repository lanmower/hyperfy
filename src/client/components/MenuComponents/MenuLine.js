import { css } from '@firebolt-dev/css'

export function MenuLine() {
  return (
    <div
      className='menuline'
      css={css`
        height: 0;
        border-top: 0.1rem solid rgba(255, 255, 255, 0.1);
        margin: 0.5rem 0.4rem;
      `}
    />
  )
}
