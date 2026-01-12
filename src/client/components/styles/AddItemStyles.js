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
