import { css } from '@firebolt-dev/css'
import { ChevronRightIcon } from '../Icons.js'
import { useMenuHint, useFieldSwitch } from '../hooks/index.js'

export function MenuItemSwitch({ label, hint, options, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const { selected, prev, next } = useFieldSwitch(options, value, onChange)
  return (
    <div
      className='menuitemswitch'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemswitch-label { flex: 1; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; padding-right: 1rem; }
        .menuitemswitch-btn {
          width: 2.125rem; height: 2.125rem; display: none; align-items: center; justify-content: center; opacity: 0.2;
          &:hover { cursor: pointer; opacity: 1; }
        }
        .menuitemswitch-text { line-height: 1; }
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          .menuitemswitch-btn { display: flex; }
        }
      `}
      {...hintProps}
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
