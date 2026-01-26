import React from 'react'
import { css } from '@firebolt-dev/css'
import { useFieldHint, fieldWrapperCss, fieldLabelCss } from '../hooks/index.js'

export function FieldToggle({ label, hint, trueLabel = 'Yes', falseLabel = 'No', value, onChange }) {
  const hintProps = useFieldHint(hint)
  return (
    <div
      className='fieldtoggle'
      css={css`
        ${fieldWrapperCss}
        cursor: pointer;
        .fieldtoggle-label { ${fieldLabelCss} flex: 1; padding-right: 1rem; }
        .fieldtoggle-text { font-size: 0.9375rem; }
      `}
      {...hintProps}
      onClick={() => onChange(!value)}
    >
      <div className='fieldtoggle-label'>{label}</div>
      <div className='fieldtoggle-text'>{value ? trueLabel : falseLabel}</div>
    </div>
  )
}
