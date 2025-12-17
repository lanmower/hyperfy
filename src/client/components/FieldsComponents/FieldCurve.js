import { css } from '@firebolt-dev/css'
import { useContext, useMemo, useState } from 'react'
import { HintContext } from '../Hint.js'
import { Curve } from '../../../core/extras/assets/Curve.js'
import { CurvePreview } from '../../CurvePreview.js'
import { Portal } from '../../Portal.js'
import { CurvePane } from '../../CurvePane.js'

export function FieldCurve({ label, hint, x, xRange, y, yMin, yMax, value, onChange }) {
  const { setHint } = useContext(HintContext)
  const curve = useMemo(() => new Curve().deserialize(value || '0,0.5,0,0|1,0.5,0,0'), [value])
  const [edit, setEdit] = useState(false)
  return (
    <div
      className='fieldcurve'
      css={css`
        .fieldcurve-control {
          display: flex;
          align-items: center;
          height: 2.5rem;
          padding: 0 1rem;
        }
        .fieldcurve-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .fieldcurve-curve {
          width: 6rem;
          height: 1.2rem;
          position: relative;
        }
        &:hover {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.03);
        }
      `}
    >
      <div
        className='fieldcurve-control'
        onClick={() => {
          if (edit) {
            setEdit(null)
          } else {
            setEdit(curve.clone())
          }
        }}
        onPointerEnter={() => setHint(hint)}
        onPointerLeave={() => setHint(null)}
      >
        <div className='fieldcurve-label'>{label}</div>
        <div className='fieldcurve-curve'>
          <CurvePreview curve={curve} yMin={yMin} yMax={yMax} />
        </div>
      </div>
      {edit && (
        <Portal>
          <CurvePane
            curve={edit}
            title={label}
            xLabel={x}
            xRange={xRange}
            yLabel={y}
            yMin={yMin}
            yMax={yMax}
            onCommit={() => {
              onChange(edit.serialize())
              setEdit(null)
            }}
            onCancel={() => {
              setEdit(null)
            }}
          />
        </Portal>
      )}
    </div>
  )
}
