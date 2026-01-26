import React from 'react'
import { css } from '@firebolt-dev/css'
import { useFieldHint, useFieldRange, fieldWrapperCss, fieldLabelCss } from '../hooks/index.js'

export function FieldRange({ label, hint, min = 0, max = 1, step = 0.05, instant, value, onChange }) {
  const hintProps = useFieldHint(hint)
  const { trackRef, barWidthPercentage, text } = useFieldRange(value, onChange, { min, max, step, instant })

  return (
    <div
      className='fieldrange'
      css={css`
        ${fieldWrapperCss}
        .fieldrange-label {
          flex: 1;
          ${fieldLabelCss}
          padding-right: 1rem;
        }
        .fieldrange-text {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          margin-right: 0.5rem;
          opacity: 0;
        }
        .fieldrange-track {
          width: 7rem;
          flex-shrink: 0;
          height: 0.5rem;
          border-radius: 0.1rem;
          display: flex;
          align-items: stretch;
          background-color: rgba(255, 255, 255, 0.1);
          &:hover { cursor: pointer; }
        }
        .fieldrange-bar {
          background-color: white;
          border-radius: 0.1rem;
          width: ${barWidthPercentage}%;
        }
        &:hover {
          .fieldrange-text { opacity: 1; }
        }
      `}
      {...hintProps}
    >
      <div className='fieldrange-label'>{label}</div>
      <div className='fieldrange-text'>{text}</div>
      <div className='fieldrange-track' ref={trackRef}>
        <div className='fieldrange-bar' />
      </div>
    </div>
  )
}
