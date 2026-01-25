import React from 'react'
import { createContext, useState } from 'react'
import { css } from '@firebolt-dev/css'

export const MenuContext = createContext()

export function Menu({  title, blur, children  }: any)) {
  const [hint, setHint] = useState(null)
  return (
    <MenuContext.Provider value={setHint}>
      <div
        className='menu'
        css={css`
          pointer-events: auto;
          opacity: ${blur ? 0.3 : 1};
          transition: opacity 0.15s ease-out;
          font-size: 1rem;
          .menu-head {
            background: #0f1018;
            padding: 1rem;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            span {
              font-size: 1.3rem;
              font-weight: 600;
            }
          }
          .menu-items {
            background-color: rgba(15, 16, 24, 0.8);
            overflow-y: auto;
            max-height: calc(2.5rem * 9.5);
          }
        `}
      >
        <div className='menu-head'>
          <span>{title}</span>
        </div>
        <div className='menu-items noscrollbar'>{children}</div>
        {hint && <MenuHint text={hint} />}
      </div>
    </MenuContext.Provider>
  )
}

function MenuHint({ text }) {
  return (
    <div
      className='menuhint'
      css={css`
        margin-top: 0.2rem;
        padding: 0.875rem;
        font-size: 1rem;
        line-height: 1.4;
        background-color: rgba(15, 16, 24, 0.8);
        border-top: 0.1rem solid black;
      `}
    >
      <span>{text}</span>
    </div>
  )
}
