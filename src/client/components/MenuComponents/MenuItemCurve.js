import { useContext, useMemo, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { CurvePreview } from '../CurvePreview.js'
import { Curve } from '../../core/extras/assets/Curve.js'
import { Portal } from '../Portal.js'
import { CurvePane } from '../CurvePane.js'
import { MenuContext } from './Menu.js'

export function MenuItemCurve({ label, hint, x, xRange, y, yMin, yMax, value, onChange }) {
  const setHint = useContext(MenuContext)
  const curve = useMemo(() => new Curve().deserialize(value || '0,0.5,0,0|1,0.5,0,0'), [value])
  const [edit, setEdit] = useState(false)
  return (
    <div
      className='menuitemcurve'
      css={css`
        .menuitemcurve-control {
          display: flex;
          align-items: center;
          height: 2.5rem;
          padding: 0 0.875rem;
        }
        .menuitemcurve-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemcurve-curve {
          width: 6rem;
          height: 1.2rem;
          position: relative;
        }
        &:hover {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}
    >
      <div
        className='menuitemcurve-control'
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
        <div className='menuitemcurve-label'>{label}</div>
        <div className='menuitemcurve-curve'>
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
