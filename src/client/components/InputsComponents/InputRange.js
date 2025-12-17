import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'

export function InputRange({ value, onChange, min = 0, max = 1, step = 0.05, instant }) {
  if (value === undefined || value === null) {
    value = 0
  }
  const [local, setLocal] = useState(value)
  const [sliding, setSliding] = useState(false)
  useEffect(() => {
    if (!sliding && local !== value) setLocal(value)
  }, [sliding, value])
  const handleChange = e => {
    const value = parseFloat(e.target.value)
    if (instant) {
      onChange(value)
    }
    setLocal(value)
  }
  return (
    <div
      className='inputrange'
      css={css`
        display: flex;
        align-items: center;
        border: 1px solid #252630;
        border-radius: 10px;
        height: 34px;
        padding: 3px;
        input {
          appearance: none;
          width: 100%;
          cursor: pointer;
          outline: none;
          &::-webkit-slider-runnable-track {
          }
          &::-webkit-slider-thumb {
            appearance: none;
            height: 28px;
            width: 20px;
            background: #3a3c4c;
            border-radius: 7px;
          }
        }
        .inputrange-value {
          height: 34px;
          border-right: 1px solid #252630;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          padding: 0 8px;
          flex-shrink: 0;
        }
      `}
    >
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={handleChange}
        onPointerDown={() => setSliding(true)}
        onPointerUp={() => {
          setSliding(false)
          if (!instant) {
            onChange(local)
          }
        }}
      />
    </div>
  )
}
