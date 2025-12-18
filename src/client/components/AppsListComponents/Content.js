import { css } from '@firebolt-dev/css'
import { useEffect, useMemo, useState } from 'react'
import { BoxIcon, BrickWallIcon, CrosshairIcon, FileCode2Icon, HardDriveIcon, HashIcon, OctagonXIcon, TriangleIcon } from 'lucide-react'
import { orderBy } from 'lodash-es'
import { cls } from '../cls.js'
import { formatBytes } from '../../../core/extras/formatBytes.js'
import { useWorldEvents } from '../hooks/index.js'

const defaultStats = { geometries: 0, triangles: 0, textureBytes: 0, fileBytes: 0 }

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  const million = 1000000, thousand = 1000
  let result = num >= million ? (num / million).toFixed(1) + 'M' : num >= thousand ? (num / thousand).toFixed(1) + 'K' : Math.round(num).toString()
  return result.replace(/\.0+([KM])?$/, '$1').replace(/(\.\d+[1-9])0+([KM])?$/, '$1$2')
}

const columns = [
  { key: 'name', className: 'name', flex: true },
  { key: 'count', className: 'count', title: 'Instances', icon: HashIcon },
  { key: 'geometries', className: 'geometries', title: 'Geometries', icon: BoxIcon },
  { key: 'triangles', className: 'triangles', title: 'Triangles', icon: TriangleIcon },
  { key: 'textureBytes', className: 'textureSize', title: 'Texture Memory Size', icon: BrickWallIcon },
  { key: 'code', className: 'code', title: 'Code', icon: FileCode2Icon },
  { key: 'fileBytes', className: 'fileSize', title: 'File Size', icon: HardDriveIcon, iconSize: 16 },
]

export function Content({ world, query, perf, refresh, setRefresh }) {
  const [sort, setSort] = useState('count')
  const [asc, setAsc] = useState(false)
  const [target, setTarget] = useState(null)

  let items = useMemo(() => {
    const itemMap = new Map()
    for (const [_, entity] of world.entities.items) {
      if (!entity.isApp) continue
      const blueprint = world.blueprints.get(entity.data.blueprint)
      if (!blueprint?.model) continue
      let item = itemMap.get(blueprint.id)
      if (!item) {
        const type = blueprint.model.endsWith('.vrm') ? 'avatar' : 'model'
        const model = world.loader.get(type, blueprint.model)
        const stats = model?.getStats() || defaultStats
        const name = blueprint.name || '-'
        item = {
          blueprint, keywords: name.toLowerCase(), name, count: 0,
          geometries: stats.geometries.size, triangles: stats.triangles,
          textureBytes: stats.textureBytes, textureSize: formatBytes(stats.textureBytes),
          code: blueprint.script ? 1 : 0, fileBytes: stats.fileBytes, fileSize: formatBytes(stats.fileBytes),
        }
        itemMap.set(blueprint.id, item)
      }
      item.count++
    }
    return [...itemMap.values()]
  }, [refresh])

  items = useMemo(() => {
    let newItems = query ? items.filter(item => item.keywords.includes(query.toLowerCase())) : items
    return orderBy(newItems, sort, asc ? 'asc' : 'desc')
  }, [items, sort, asc, query])

  const handleEntityChange = () => setRefresh(n => n + 1)
  useWorldEvents(world.entities, { added: handleEntityChange, removed: handleEntityChange })

  const reorder = key => sort === key ? setAsc(!asc) : (setSort(key), setAsc(false))
  useEffect(() => () => world.target.hide(), [])

  const getClosest = item => {
    const playerPosition = world.rig.position
    let closestEntity, closestDistance = null
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
    if (target === item) { world.target.hide(); setTarget(null); return }
    const entity = getClosest(item)
    if (!entity) return
    world.target.show(entity.root.position)
    setTarget(item)
  }
  const inspect = item => world.ui.setApp(getClosest(item))
  const toggle = item => {
    const blueprint = world.blueprints.get(item.blueprint.id)
    const version = blueprint.version + 1, disabled = !blueprint.disabled
    world.blueprints.modify({ id: blueprint.id, version, disabled })
    world.network.send('blueprintModified', { id: blueprint.id, version, disabled })
    setRefresh(n => n + 1)
  }

  const getValue = (item, col) => {
    if (col.key === 'triangles') return formatNumber(item.triangles)
    if (col.key === 'textureBytes') return item.textureSize
    if (col.key === 'fileBytes') return item.fileSize
    if (col.key === 'code') return item.code ? 'Yes' : 'No'
    return item[col.key]
  }

  return (
    <div
      className={cls('appslist', { hideperf: !perf })}
      css={css`
        flex: 1;
        .appslist-col { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
        .appslist-col.name { flex: 1; }
        .appslist-col.code { width: 3rem; text-align: right; }
        .appslist-col.count, .appslist-col.geometries, .appslist-col.triangles { width: 4rem; text-align: right; }
        .appslist-col.textureSize, .appslist-col.fileSize { width: 5rem; text-align: right; }
        .appslist-col.actions { display: flex; align-items: center; justify-content: flex-end; width: 5.45rem; }
        .appslist-head {
          position: sticky; top: 0; display: flex; align-items: center;
          padding: 0.6rem 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin: 0 0 0.3125rem;
          .appslist-col { font-size: 1rem; font-weight: 500; &:hover:not(.active) { cursor: pointer; } &.active { color: #4088ff; } }
        }
        .appslist-row {
          display: flex; align-items: center; padding: 0.6rem 1rem;
          &:hover { cursor: pointer; background: rgba(255, 255, 255, 0.03); }
          .appslist-col { font-size: 1rem; color: rgba(255, 255, 255, 0.8); }
        }
        .appslist-action { margin-left: 0.625rem; color: #5d6077; &.active { color: white; } &:hover { cursor: pointer; } }
        &.hideperf {
          .appslist-head { display: none; }
          .appslist-col.count, .appslist-col.code, .appslist-col.geometries, .appslist-col.triangles, .appslist-col.textureSize, .appslist-col.fileSize { display: none; }
        }
      `}
    >
      <div className='appslist-head'>
        {columns.map(col => (
          <div key={col.key} className={cls('appslist-col', col.className, { active: sort === col.key })} onClick={() => reorder(col.key)} title={col.title}>
            {col.icon && <col.icon size={col.iconSize || '1.125rem'} />}
          </div>
        ))}
        <div className='appslist-col actions' />
      </div>
      <div className='appslist-rows'>
        {items.map(item => (
          <div key={item.blueprint.id} className='appslist-row'>
            {columns.map(col => (
              <div key={col.key} className={cls('appslist-col', col.className)} onClick={col.key === 'name' ? () => inspect(item) : undefined}>
                <span>{getValue(item, col)}</span>
              </div>
            ))}
            <div className='appslist-col actions'>
              {!item.blueprint.scene && (
                <>
                  <div className={cls('appslist-action', { active: item.blueprint.disabled })} onClick={() => toggle(item)}><OctagonXIcon size='1rem' /></div>
                  <div className={cls('appslist-action', { active: target === item })} onClick={() => toggleTarget(item)}><CrosshairIcon size='1rem' /></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
