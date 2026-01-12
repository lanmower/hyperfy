import { css } from '@firebolt-dev/css'

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
