import React from 'react'
import { css } from '@firebolt-dev/css'
import { useFieldHint, useFieldCurve, fieldLabelCss } from '../hooks/index.js'
import { CurvePreview } from '../../CurvePreview.js'
import { Portal } from '../../Portal.js'
import { CurvePane } from '../../CurvePane.js'

export function FieldCurve({ label, hint, x, xRange, y, yMin, yMax, value, onChange }) {
  const hintProps = useFieldHint(hint)
  const { curve, edit, toggleEdit, onCommit, onCancel } = useFieldCurve(value, onChange)
  return (
    <div
      className='fieldcurve'
      css={css`
        .fieldcurve-control { display: flex; align-items: center; height: 2.5rem; padding: 0 1rem; }
        .fieldcurve-label { ${fieldLabelCss} flex: 1; padding-right: 1rem; }
        .fieldcurve-curve { width: 6rem; height: 1.2rem; position: relative; }
        &:hover { cursor: pointer; background-color: rgba(255, 255, 255, 0.03); }
      `}
    >
      <div className='fieldcurve-control' onClick={toggleEdit} {...hintProps}>
        <div className='fieldcurve-label'>{label}</div>
        <div className='fieldcurve-curve'>
          <CurvePreview curve={curve} yMin={yMin} yMax={yMax} />
        </div>
      </div>
      {edit && (
        <Portal>
          <CurvePane curve={edit} title={label} xLabel={x} xRange={xRange} yLabel={y} yMin={yMin} yMax={yMax} onCommit={onCommit} onCancel={onCancel} />
        </Portal>
      )}
    </div>
  )
}
