import { css } from '@firebolt-dev/css'
import { useFieldHint, useFieldNumber, fieldLabelCss, fieldWrapperCss, fieldInputCss } from '../hooks/index.js'

export function FieldNumber({ label, hint, dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2, value, onChange }) {
  const hintProps = useFieldHint(hint)
  const inputProps = useFieldNumber(value, onChange, { dp, min, max, step, bigStep })

  return (
    <label
      className='fieldnumber'
      css={css`
        ${fieldWrapperCss}
        cursor: pointer;
        .fieldnumber-label { ${fieldLabelCss} }
        .fieldnumber-field { flex: 1; }
        input { ${fieldInputCss} height: 1rem; overflow: hidden; }
      `}
      {...hintProps}
    >
      <div className='fieldnumber-label'>{label}</div>
      <div className='fieldnumber-field'>
        <input type='text' {...inputProps} />
      </div>
    </label>
  )
}
