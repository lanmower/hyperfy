import { css } from '@firebolt-dev/css'
import { useMenuHint, useFieldRange, menuWrapperCss } from '../hooks/index.js'

export function MenuItemRange({ label, hint, min = 0, max = 1, step = 0.05, instant, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const { trackRef, barWidthPercentage, text } = useFieldRange(value, onChange, { min, max, step, instant })

  return (
    <div
      className='menuitemrange'
      css={css`
        ${menuWrapperCss}
        .menuitemrange-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding-right: 1rem;
        }
        .menuitemrange-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-right: 0.5rem;
          opacity: 0;
        }
        .menuitemrange-track {
          width: 7rem;
          flex-shrink: 0;
          height: 0.5rem;
          border-radius: 0.1rem;
          display: flex;
          align-items: stretch;
          background-color: rgba(255, 255, 255, 0.1);
          &:hover { cursor: pointer; }
        }
        .menuitemrange-bar {
          background-color: white;
          border-radius: 0.1rem;
          width: ${barWidthPercentage}%;
        }
        &:hover {
          .menuitemrange-text { opacity: 1; }
        }
      `}
      {...hintProps}
    >
      <div className='menuitemrange-label'>{label}</div>
      <div className='menuitemrange-text'>{text}</div>
      <div className='menuitemrange-track' ref={trackRef}>
        <div className='menuitemrange-bar' />
      </div>
    </div>
  )
}
