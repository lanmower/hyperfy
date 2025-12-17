import { css } from '@firebolt-dev/css'
import { useMenuHint, useFieldNumber, menuLabelCss, menuWrapperCss, menuInputCss } from '../hooks/index.js'

export function MenuItemNumber({ label, hint, dp = 0, min = -Infinity, max = Infinity, step = 1, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const inputProps = useFieldNumber(value, onChange, { dp, min, max, step })
  return (
    <label
      className='menuitemnumber'
      css={css`
        ${menuWrapperCss}
        cursor: pointer;
        .menuitemnumber-label { ${menuLabelCss} }
        .menuitemnumber-field { flex: 1; }
        input { ${menuInputCss} }
      `}
      {...hintProps}
    >
      <div className='menuitemnumber-label'>{label}</div>
      <div className='menuitemnumber-field'>
        <input type='text' {...inputProps} />
      </div>
    </label>
  )
}
