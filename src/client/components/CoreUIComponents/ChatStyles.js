import { css } from '@firebolt-dev/css'

export const chatStyles = css`
  position: absolute;
  left: calc(2rem + env(safe-area-inset-left));
  bottom: calc(2rem + env(safe-area-inset-bottom));
  width: 20rem;
  font-size: 1rem;
  @media all and (max-width: 1200px) {
    left: calc(1rem + env(safe-area-inset-left));
    bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  .mainchat-msgs {
    padding: 0 0 0.5rem 0.4rem;
  }
  .mainchat-btn {
    pointer-events: auto;
    width: 2.875rem;
    height: 2.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(11, 10, 21, 0.85);
    border: 0.0625rem solid #2a2b39;
    border-radius: 1rem;
    &:hover {
      cursor: pointer;
    }
    opacity: 0;
  }
  .mainchat-entry {
    height: 2.875rem;
    padding: 0 1rem;
    background: rgba(11, 10, 21, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 2rem;
    display: flex;
    align-items: center;
    display: none;
    input {
      font-size: 0.9375rem;
      line-height: 1;
    }
  }
  .mainchat-send {
    width: 2.875rem;
    height: 2.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: -0.6rem;
  }
  &.active {
    pointer-events: auto;
    .mainchat-btn {
      display: none;
    }
    .mainchat-entry {
      display: flex;
    }
  }
`
