import { css } from '@firebolt-dev/css'

export const scriptStyles = css`
  pointer-events: auto;
  align-self: stretch;
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 23.7rem;
  position: relative;
  .script-head {
    height: 3.125rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .script-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .script-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    &:hover {
      cursor: pointer;
      color: white;
    }
  }
  .script-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -5px;
    width: 10px;
    cursor: ew-resize;
  }
  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
`
