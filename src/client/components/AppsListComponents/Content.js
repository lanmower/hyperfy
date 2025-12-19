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
import { contentStyles } from './ContentStyles.js'

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
    <div className={cls('appslist', { hideperf: !perf })} css={contentStyles}>
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
