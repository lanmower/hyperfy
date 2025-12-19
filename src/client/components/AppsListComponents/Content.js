import { css } from '@firebolt-dev/css'
import { useEffect, useState, useMemo } from 'react'
import {
  BoxIcon,
  BrickWallIcon,
  CrosshairIcon,
  FileCode2Icon,
  HardDriveIcon,
  HashIcon,
  OctagonXIcon,
  TriangleIcon,
} from 'lucide-react'
import { cls } from '../cls.js'
import { useAppStats, formatNumber } from '../hooks/useAppStats.js'
import { EntityTargeting } from './EntityTargeting.js'
import { AppActions } from './AppActions.js'

export function Content({ world, query, perf, refresh, setRefresh }) {
  const [sort, setSort] = useState('count')
  const [asc, setAsc] = useState(false)
  const { items } = useAppStats(world, { query, sortKey: sort, ascending: asc, refresh })

  const entityTargeting = useMemo(() => new EntityTargeting(world), [world])
  const appActions = useMemo(() => new AppActions(world, world.network, world.blueprints, entityTargeting, setRefresh), [world, entityTargeting, setRefresh])

  const reorder = key => {
    if (sort === key) {
      setAsc(!asc)
    } else {
      setSort(key)
      setAsc(false)
    }
  }

  useEffect(() => {
    return () => entityTargeting.hide()
  }, [entityTargeting])

  const handleToggleTarget = item => {
    entityTargeting.toggle(item)
  }

  const handleInspect = item => {
    appActions.inspect(item)
  }

  const handleToggle = item => {
    appActions.toggle(item)
  }
  return (
    <div
      className={cls('appslist', { hideperf: !perf })}
      css={css`
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
      `}
    >
      <div className='appslist-head'>
        <div
          className={cls('appslist-headitem name', { active: sort === 'name' })}
          onClick={() => reorder('name')}
          title='Name'
        >
          <span></span>
        </div>
        <div
          className={cls('appslist-headitem count', { active: sort === 'count' })}
          onClick={() => reorder('count')}
          title='Instances'
        >
          <HashIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem geometries', { active: sort === 'geometries' })}
          onClick={() => reorder('geometries')}
          title='Geometries'
        >
          <BoxIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem triangles', { active: sort === 'triangles' })}
          onClick={() => reorder('triangles')}
          title='Triangles'
        >
          <TriangleIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem textureSize', { active: sort === 'textureBytes' })}
          onClick={() => reorder('textureBytes')}
          title='Texture Memory Size'
        >
          <BrickWallIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem code', { active: sort === 'code' })}
          onClick={() => reorder('code')}
          title='Code'
        >
          <FileCode2Icon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem fileSize', { active: sort === 'fileBytes' })}
          onClick={() => reorder('fileBytes')}
          title='File Size'
        >
          <HardDriveIcon size={16} />
        </div>
        <div className='appslist-headitem actions' />
      </div>
      <div className='appslist-rows'>
        {items.map(item => (
          <div key={item.blueprint.id} className='appslist-row'>
            <div className='appslist-rowitem name' onClick={() => handleInspect(item)}>
              <span>{item.name}</span>
            </div>
            <div className='appslist-rowitem count'>
              <span>{item.count}</span>
            </div>
            <div className='appslist-rowitem geometries'>
              <span>{item.geometries}</span>
            </div>
            <div className='appslist-rowitem triangles'>
              <span>{formatNumber(item.triangles)}</span>
            </div>
            <div className='appslist-rowitem textureSize'>
              <span>{item.textureSize}</span>
            </div>
            <div className='appslist-rowitem code'>
              <span>{item.code ? 'Yes' : 'No'}</span>
            </div>
            <div className='appslist-rowitem fileSize'>
              <span>{item.fileSize}</span>
            </div>
            <div className={'appslist-rowitem actions'}>
              {!item.blueprint.scene && (
                <>
                  <div
                    className={cls('appslist-action', { active: item.blueprint.disabled })}
                    onClick={() => handleToggle(item)}
                  >
                    <OctagonXIcon size='1rem' />
                  </div>
                  <div
                    className={cls('appslist-action', { active: entityTargeting.isTargeting(item) })}
                    onClick={() => handleToggleTarget(item)}
                  >
                    <CrosshairIcon size='1rem' />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
