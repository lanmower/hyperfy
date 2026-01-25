import React from 'react'
import { css } from '@firebolt-dev/css'
import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cls } from '../cls.js'

export function InputDropdown({  options, value, onChange  }: any)) {
  const current = options.find(o => o.value === value)
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(!open)
  return (
    <div
      className='inputdropdown'
      css={css`
        position: relative;
        .inputdropdown-current {
          display: flex;
          align-items: center;
          background: #252630;
          border-radius: 10px;
          height: 34px;
          padding: 0 8px;
          cursor: pointer;
          span {
            font-size: 14px;
            flex: 1;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }
        .inputdropdown-menu {
          z-index: 1;
          margin: 3px 0 20px;
          position: absolute;
          left: 0;
          right: 0;
          background: #252630;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          border-radius: 10px;
          overflow: hidden;
          padding: 4px 0;
        }
        .inputdropdown-option {
          font-size: 14px;
          padding: 8px;
          &:hover {
            cursor: pointer;
            background: rgb(46, 47, 59);
          }
        }
      `}
    >
      <div className='inputdropdown-current' onClick={toggle}>
        <span>{current?.label || ''}</span>
        <ChevronDownIcon size={12} />
      </div>
      {open && (
        <div className='inputdropdown-menu'>
          {options.map(option => (
            <div
              key={option.value}
              className={cls('inputdropdown-option', { selected: value === option.value })}
              onClick={() => {
                setOpen(false)
                onChange(option.value)
              }}
            >
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
