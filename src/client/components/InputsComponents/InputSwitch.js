import { css } from '@firebolt-dev/css'
import { cls } from '../cls.js'

export function InputSwitch({ options, value, onChange }) {
  return (
    <div
      className='inputswitch'
      css={css`
        display: flex;
        align-items: center;
        border: 1px solid #252630;
        border-radius: 10px;
        padding: 3px;
        .inputswitch-option {
          flex: 1;
          border-radius: 7px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          span {
            line-height: 1;
            font-size: 14px;
          }
          &.selected {
            background: #252630;
          }
        }
      `}
    >
      {options.map(option => (
        <div
          key={option.value}
          className={cls('inputswitch-option', { selected: value === option.value })}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
        </div>
      ))}
    </div>
  )
}
