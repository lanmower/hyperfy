import { css } from '@firebolt-dev/css'

export const addStyles = (span, gap) => css`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  display: flex;
  flex-direction: column;
  min-height: 17rem;
  .add-head {
    height: 3.125rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .add-title {
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .add-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  .add-items {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    gap: ${gap};
  }
  .add-item {
    flex-basis: calc((100% / ${span}) - (${gap} * (${span} - 1) / ${span}));
    cursor: pointer;
  }
  .add-item-image {
    width: 100%;
    aspect-ratio: 1;
    background-color: #1c1d22;
    background-size: cover;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.7rem;
    margin: 0 0 0.4rem;
  }
  .add-item-name {
    text-align: center;
    font-size: 0.875rem;
  }
`

export const addItemImageStyles = url => css`
  background-image: url(${url});
`

export const appsStyles = css`
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 17rem;
  .apps-head {
    height: 3.125rem;
    padding: 0 0.6rem 0 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
  }
  .apps-title {
    flex: 1;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
  }
  .apps-search {
    display: flex;
    align-items: center;
    input {
      margin-left: 0.5rem;
      width: 5rem;
      font-size: 0.9375rem;
      &::placeholder {
        color: #5d6077;
      }
      &::selection {
        background-color: white;
        color: rgba(0, 0, 0, 0.8);
      }
    }
  }
  .apps-toggle {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 0 1rem;
    color: #5d6077;
    &:hover {
      cursor: pointer;
    }
    &.active {
      color: white;
    }
  }
  .apps-content {
    flex: 1;
    overflow-y: auto;
  }
`

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

export const prefsStyles = css`
  overflow-y: auto;
  background: rgba(11, 10, 21, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.375rem;
  padding: 0.6rem 0;
`

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
