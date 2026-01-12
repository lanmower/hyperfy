import { css } from '@firebolt-dev/css'
import { useMenuHint, useFieldText, menuLabelCss, menuWrapperCss, menuInputCss } from '../hooks/index.js'

export function MenuItemText({ label, hint, placeholder, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const inputProps = useFieldText(value, onChange)
  return (
    <label
      className='menuitemtext'
      css={css`
        ${menuWrapperCss}
        .menuitemtext-label { ${menuLabelCss} }
        .menuitemtext-field { flex: 1; }
        input { ${menuInputCss} }
      `}
      {...hintProps}
    >
      <div className='menuitemtext-label'>{label}</div>
      <div className='menuitemtext-field'>
        <input type='text' placeholder={placeholder} {...inputProps} />
      </div>
    </label>
  )
}
