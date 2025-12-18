import { css } from '@firebolt-dev/css'
import { useMenuHint, useFieldCurve, menuLabelCss } from '../hooks/index.js'
import { CurvePreview } from '../CurvePreview.js'
import { Portal } from '../Portal.js'
import { CurvePane } from '../CurvePane.js'

export function MenuItemCurve({ label, hint, x, xRange, y, yMin, yMax, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const { curve, edit, toggleEdit, onCommit, onCancel } = useFieldCurve(value, onChange)
  return (
    <div
      className='menuitemcurve'
      css={css`
        .menuitemcurve-control { display: flex; align-items: center; height: 2.5rem; padding: 0 0.875rem; }
        .menuitemcurve-label { ${menuLabelCss} flex: 1; padding-right: 1rem; }
        .menuitemcurve-curve { width: 6rem; height: 1.2rem; position: relative; }
        &:hover { cursor: pointer; background-color: rgba(255, 255, 255, 0.05); }
      `}
    >
      <div className='menuitemcurve-control' onClick={toggleEdit} {...hintProps}>
        <div className='menuitemcurve-label'>{label}</div>
        <div className='menuitemcurve-curve'>
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
