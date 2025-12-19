import { css } from '@firebolt-dev/css'
import { ChevronLeftIcon } from '../../Icons.js'
import { useMenuHint } from '../hooks/index.js'

export function MenuItemBack({ hint, onClick }) {
  const hintProps = useMenuHint(hint)
  return (
    <label
      className='menuback'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.825rem;
        font-size: 1rem;
        > svg { margin-left: -0.25rem; }
        .menuback-label { flex: 1; }
        &:hover { cursor: pointer; background: rgba(255, 255, 255, 0.05); }
      `}
      {...hintProps}
      onClick={onClick}
    >
      <ChevronLeftIcon size={'1.5rem'} />
      <div className='menuback-label'><span>Back</span></div>
    </label>
  )
}
