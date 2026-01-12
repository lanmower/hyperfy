import { css } from '@firebolt-dev/css'
import { useFieldHint, useFieldVec3, fieldLabelCss, fieldWrapperCss, fieldInputCss } from '../hooks/index.js'

export function FieldVec3({ label, hint, dp = 0, min = -Infinity, max = Infinity, step = 1, bigStep = 2, value, onChange }) {
  const hintProps = useFieldHint(hint)
  const inputs = useFieldVec3(value, onChange, { dp, min, max, step, bigStep })
  return (
    <label
      className='fieldvec3'
      css={css`
        ${fieldWrapperCss}
        .fieldvec3-label { ${fieldLabelCss} }
        .fieldvec3-field {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        input {
          ${fieldInputCss}
          font-size: 0.9375rem;
          height: 1rem;
          overflow: hidden;
        }
      `}
      {...hintProps}
    >
      <div className='fieldvec3-label'>{label}</div>
      <div className='fieldvec3-field'>
        <input {...inputs.x} />
        <input {...inputs.y} />
        <input {...inputs.z} />
      </div>
    </label>
  )
}
