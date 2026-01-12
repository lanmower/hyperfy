export const fieldLabelCss = `
  width: 9.4rem;
  flex-shrink: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.6);
`

export const fieldWrapperCss = `
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 1rem;
  cursor: text;
  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
`

export const fieldInputCss = `
  font-size: 0.9375rem;
  text-align: right;
  cursor: inherit;
  &::selection {
    background-color: white;
    color: rgba(0, 0, 0, 0.8);
  }
`

export const menuLabelCss = `
  width: 9.4rem;
  flex-shrink: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

export const menuWrapperCss = `
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 0.875rem;
  cursor: text;
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`

export const menuInputCss = `
  text-align: right;
  cursor: inherit;
  &::selection {
    background-color: white;
    color: rgba(0, 0, 0, 0.8);
  }
`
