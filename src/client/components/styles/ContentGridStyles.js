import { css } from '@firebolt-dev/css'

export const contentStyles = css`
  flex: 1;
  .appslist-head {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    margin: 0 0 0.3125rem;
  }
  .appslist-headitem {
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &.name {
      flex: 1;
    }
    &.code {
      width: 3rem;
      text-align: right;
    }
    &.count,
    &.geometries,
    &.triangles {
      width: 4rem;
      text-align: right;
    }
    &.textureSize,
    &.fileSize {
      width: 5rem;
      text-align: right;
    }
    &.actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      width: 5.45rem;
    }
    &:hover:not(.active) {
      cursor: pointer;
    }
    &.active {
      color: #4088ff;
    }
  }
  .appslist-rows {
  }
  .appslist-row {
    display: flex;
    align-items: center;
    padding: 0.6rem 1rem;
    &:hover {
      cursor: pointer;
      background: rgba(255, 255, 255, 0.03);
    }
  }
  .appslist-rowitem {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &.name {
      flex: 1;
    }
    &.code {
      width: 3rem;
      text-align: right;
    }
    &.count,
    &.geometries,
    &.triangles {
      width: 4rem;
      text-align: right;
    }
    &.textureSize,
    &.fileSize {
      width: 5rem;
      text-align: right;
    }
    &.actions {
      width: 5.45rem;
      display: flex;
      justify-content: flex-end;
    }
  }
  .appslist-action {
    margin-left: 0.625rem;
    color: #5d6077;
    &.active {
      color: white;
    }
    &:hover {
      cursor: pointer;
    }
  }
  &.hideperf {
    .appslist-head {
      display: none;
    }
    .appslist-rowitem {
      &.count,
      &.code,
      &.geometries,
      &.triangles,
      &.textureSize,
      &.fileSize {
        display: none;
      }
    }
  }
`
