import { css } from '@firebolt-dev/css'
import { useFieldText } from '../hooks/index.js'

export function InputText({ value, onChange, placeholder }) {
  const inputProps = useFieldText(value, onChange)
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
      <input type='text' placeholder={placeholder} {...inputProps} />
    </label>
  )
}
