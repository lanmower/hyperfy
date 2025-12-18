import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'
import {
  BoxIcon,
  BrickWallIcon,
  CrosshairIcon,
  EyeIcon,
  EyeOffIcon,
  FileCode2Icon,
  HardDriveIcon,
  HashIcon,
  SettingsIcon,
  TriangleIcon,
} from 'lucide-react'
import { cls } from '../cls.js'
import { useAppStats, formatNumber } from '../hooks/useAppStats.js'

export function Content({ world, query, refresh, setRefresh }) {
  const [sort, setSort] = useState('count')
  const [asc, setAsc] = useState(false)
  const [target, setTarget] = useState(null)
  const { items } = useAppStats(world, { query, sortKey: sort, ascending: asc, refresh })
  const reorder = key => {
    if (sort === key) {
      setAsc(!asc)
    } else {
      setSort(key)
      setAsc(false)
    }
  }
  useEffect(() => {
    return () => world.target.hide()
  }, [])
  const getClosest = item => {
    const playerPosition = world.rig.position
    let closestEntity
    let closestDistance = null
    for (const [_, entity] of world.entities.items) {
      if (entity.blueprint === item.blueprint) {
        const distance = playerPosition.distanceTo(entity.root.position)
        if (closestDistance === null || closestDistance > distance) {
          closestEntity = entity
          closestDistance = distance
        }
      }
    }
    return closestEntity
  }
  const toggleTarget = item => {
    if (target === item) {
      world.target.hide()
      setTarget(null)
      return
    }
    const entity = getClosest(item)
    if (!entity) return
    world.target.show(entity.root.position)
    setTarget(item)
  }
  const inspect = item => {
    const entity = getClosest(item)
    world.ui.setApp(entity)
  }
  const toggle = item => {
    const blueprint = world.blueprints.get(item.blueprint.id)
    const version = blueprint.version + 1
    const disabled = !blueprint.disabled
    world.blueprints.modify({ id: blueprint.id, version, disabled })
    world.network.send('blueprintModified', { id: blueprint.id, version, disabled })
    setRefresh(n => n + 1)
  }
  return (
    <div
      className='asettings'
      css={css`
        flex: 1;
        padding: 1.25rem 1.25rem 0;
        .asettings-head {
          position: sticky;
          top: 0;
          display: flex;
          align-items: center;
          margin: 0 0 0.3125rem;
        }
        .asettings-headitem {
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
            width: 5.45rem;
            text-align: right;
          }
          &:hover:not(.active) {
            cursor: pointer;
          }
          &.active {
            color: #4088ff;
          }
        }
        .asettings-rows {
          overflow-y: auto;
          padding-bottom: 1.25rem;
          max-height: 18.75rem;
        }
        .asettings-row {
          display: flex;
          align-items: center;
          margin: 0 0 0.3125rem;
        }
        .asettings-rowitem {
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
        .asettings-action {
          margin-left: 0.625rem;
          color: rgba(255, 255, 255, 0.4);
          &.active {
            color: #4088ff;
          }
          &.red {
            color: #fb4848;
          }
          &:hover {
            cursor: pointer;
          }
          &:hover:not(.active):not(.red) {
            color: white;
          }
        }
      `}
    >
      <div className='asettings-head'>
        <div
          className={cls('asettings-headitem name', { active: sort === 'name' })}
          onClick={() => reorder('name')}
          title='Name'
        >
          <span>Name</span>
        </div>
        <div
          className={cls('asettings-headitem count', { active: sort === 'count' })}
          onClick={() => reorder('count')}
          title='Instances'
        >
          <HashIcon size={16} />
        </div>
        <div
          className={cls('asettings-headitem geometries', { active: sort === 'geometries' })}
          onClick={() => reorder('geometries')}
          title='Geometries'
        >
          <BoxIcon size={16} />
        </div>
        <div
          className={cls('asettings-headitem triangles', { active: sort === 'triangles' })}
          onClick={() => reorder('triangles')}
          title='Triangles'
        >
          <TriangleIcon size={16} />
        </div>
        <div
          className={cls('asettings-headitem textureSize', { active: sort === 'textureBytes' })}
          onClick={() => reorder('textureBytes')}
          title='Texture Memory Size'
        >
          <BrickWallIcon size={16} />
        </div>
        <div
          className={cls('asettings-headitem code', { active: sort === 'code' })}
          onClick={() => reorder('code')}
          title='Code'
        >
          <FileCode2Icon size={16} />
        </div>
        <div
          className={cls('asettings-headitem fileSize', { active: sort === 'fileBytes' })}
          onClick={() => reorder('fileBytes')}
          title='File Size'
        >
          <HardDriveIcon size={16} />
        </div>
        <div className='asettings-headitem actions' />
      </div>
      <div className='asettings-rows noscrollbar'>
        {items.map(item => (
          <div key={item.blueprint.id} className='asettings-row'>
            <div className='asettings-rowitem name' onClick={() => toggleTarget(item)}>
              <span>{item.name}</span>
            </div>
            <div className='asettings-rowitem count'>
              <span>{item.count}</span>
            </div>
            <div className='asettings-rowitem geometries'>
              <span>{item.geometries}</span>
            </div>
            <div className='asettings-rowitem triangles'>
              <span>{formatNumber(item.triangles)}</span>
            </div>
            <div className='asettings-rowitem textureSize'>
              <span>{item.textureSize}</span>
            </div>
            <div className='asettings-rowitem code'>
              <span>{item.code ? 'Yes' : 'No'}</span>
            </div>
            <div className='asettings-rowitem fileSize'>
              <span>{item.fileSize}</span>
            </div>
            <div className={'asettings-rowitem actions'}>
              <div className={cls('asettings-action', { red: item.blueprint.disabled })} onClick={() => toggle(item)}>
                {item.blueprint.disabled ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </div>
              <div className={cls('asettings-action', { active: target === item })} onClick={() => toggleTarget(item)}>
                <CrosshairIcon size={16} />
              </div>
              <div className={'asettings-action'} onClick={() => inspect(item)}>
                <SettingsIcon size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
