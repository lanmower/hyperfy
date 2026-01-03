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
  flex: 1;
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

export const prefsStyles = css`
  overflow-y: auto;
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  padding: 0.6rem 0;
`

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

export const addItemImageStyles = url => css`
  background-image: url(${url});
`
