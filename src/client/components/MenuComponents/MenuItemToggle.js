import { css } from '@firebolt-dev/css'
import { useMenuHint, menuLabelCss } from '../hooks/index.js'

export function MenuItemToggle({ label, hint, trueLabel = 'Yes', falseLabel = 'No', value, onChange }) {
  const hintProps = useMenuHint(hint)
  return (
    <div
      className='menuitemtoggle'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemtoggle-label { ${menuLabelCss} flex: 1; padding-right: 1rem; }
        &:hover { cursor: pointer; background: rgba(255, 255, 255, 0.05); }
      `}
      {...hintProps}
      onClick={() => onChange(!value)}
    >
      <div className='menuitemtoggle-label'>{label}</div>
      <div className='menuitemtoggle-text'>{value ? trueLabel : falseLabel}</div>
    </div>
  )
}
