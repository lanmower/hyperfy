import { css } from '@firebolt-dev/css'

export const worldStyles = css`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 12rem;
  .world-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .world-title {
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .world-content {
    flex: 1;
    padding: 0.5rem 0;
    overflow-y: auto;
  }
`
