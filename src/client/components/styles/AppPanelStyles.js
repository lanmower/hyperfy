import { css } from '@firebolt-dev/css'

export const appStyles = css`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 1rem;
  .app-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .app-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .app-btn {
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
  .app-toggles {
    padding: 0.5rem 1.4rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .app-toggle {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6f7289;
    &:hover:not(.disabled) {
      cursor: pointer;
    }
    &.active {
      color: white;
    }
    &.disabled {
      color: #434556;
    }
  }
  .app-transforms {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .app-transforms-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    &:hover {
      cursor: pointer;
    }
  }
  .app-content {
    flex: 1;
    overflow-y: auto;
  }
`
