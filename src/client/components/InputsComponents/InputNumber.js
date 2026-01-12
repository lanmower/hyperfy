import { css } from '@firebolt-dev/css'
import { useFieldNumber } from '../hooks/index.js'

export function InputNumber({ value, onChange, dp = 0, min = -Infinity, max = Infinity, step = 1 }) {
  const inputProps = useFieldNumber(value, onChange, { dp, min, max, step })
  return (
    <label
      css={css`
        display: block;
        background-color: #252630;
        border-radius: 10px;
        padding: 0 8px;
        cursor: text;
        input { height: 34px; font-size: 14px; }
      `}
    >
      <input type='text' {...inputProps} />
    </label>
  )
}
