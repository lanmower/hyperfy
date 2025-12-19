import { css } from '@firebolt-dev/css'

export const playersStyles = css`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 1rem;
  .players-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .players-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .players-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
  .players-item {
    display: flex;
    align-items: center;
    padding: 0.1rem 0.5rem 0.1rem 1rem;
    height: 36px;
  }
  .players-name {
    flex: 1;
    display: flex;
    align-items: center;
    span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      margin-right: 0.5rem;
    }
    svg {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  .players-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    &:hover:not(.readonly) {
      cursor: pointer;
      color: white;
    }
    &.dim {
      color: #556181;
    }
  }
`
