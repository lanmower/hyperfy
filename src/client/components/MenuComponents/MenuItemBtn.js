import { css } from '@firebolt-dev/css'
import { ChevronRightIcon } from '../../Icons.js'
import { useMenuHint } from '../hooks/index.js'

export function MenuItemBtn({ label, hint, nav, onClick }) {
  const hintProps = useMenuHint(hint)
  return (
    <div
      className='menuitembutton'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.825rem;
        &:hover { cursor: pointer; background: rgba(255, 255, 255, 0.05); }
        .menuitembutton-label { flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
      `}
      {...hintProps}
      onClick={onClick}
    >
      <div className='menuitembutton-label'>{label}</div>
      {nav && <ChevronRightIcon size='1.5rem' />}
    </div>
  )
}
