import { css } from '@firebolt-dev/css'

export const sectionStyles = css`
  background: rgba(11, 10, 21, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2rem;
  padding: 0.6875rem 0;
  pointer-events: auto;
  position: relative;
  &.active {
    background: rgba(11, 10, 21, 0.9);
  }
`

export const panelBase = css`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  .panel-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .panel-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .panel-content {
    flex: 1;
    overflow-y: auto;
  }
`

export const btnStyles = css`
  width: 2.75rem;
  height: 1.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  .sidebar-btn-dot {
    display: none;
    position: absolute;
    top: 0.8rem;
    right: 0.2rem;
    width: 0.3rem;
    height: 0.3rem;
    border-radius: 0.15rem;
    background: white;
  }
  &:hover {
    cursor: pointer;
    color: white;
  }
  &.active {
    color: white;
    .sidebar-btn-dot {
      display: block;
    }
  }
  &.suspended {
    .sidebar-btn-dot {
      display: block;
    }
  }
  &.disabled {
    color: rgba(255, 255, 255, 0.3);
  }
  &.muted {
    color: #ff4b4b;
  }
`
