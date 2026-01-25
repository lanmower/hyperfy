import { useEffect, useMemo, useState } from 'react'
import { orderBy } from 'lodash-es'
import { formatBytes } from '../../../core/extras/formatBytes.js'

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }
  const million = 1000000
  const thousand = 1000
  let result
  if (num >= million) {
    result = (num / million).toFixed(1) + 'M'
  } else if (num >= thousand) {
    result = (num / thousand).toFixed(1) + 'K'
  } else {
    result = Math.round(num).toString()
  }
  return result
    .replace(/\.0+([KM])?$/, '$1')
    .replace(/(\.\d+[1-9])0+([KM])?$/, '$1$2')
}

const aggregateAppStats = (world, refresh) => {
  const itemMap = new Map()
  const items = []
  for (const [_, entity] of world.entities.items) {
    if (!entity.isApp) continue
    const blueprint = entity.blueprint
    if (!blueprint || !blueprint.model) continue
    let item = itemMap.get(blueprint.id)
    if (!item) {
      const type = blueprint.model.endsWith('.vrm') ? 'avatar' : 'model'
      const model = world.loader.get(type, blueprint.model)
      if (!model) continue
      const stats = model.getStats()
      const name = blueprint.name || '-'
      item = {
        blueprint,
        keywords: name.toLowerCase(),
        name,
        count: 0,
        geometries: stats.geometries.size,
        triangles: stats.triangles,
        textureBytes: stats.textureBytes,
        textureSize: formatBytes(stats.textureBytes),
        code: blueprint.script ? 1 : 0,
        fileBytes: stats.fileBytes,
        fileSize: formatBytes(stats.fileBytes),
      }
      itemMap.set(blueprint.id, item)
    }
    item.count++
  }
  for (const [_, item] of itemMap) {
    items.push(item)
  }
  return items
}

export function useAppStats(world, { query, sortKey = 'count', ascending = false, refresh = 0 } = {}) {
  const items = useMemo(() => aggregateAppStats(world, refresh), [refresh])

  const filtered = useMemo(() => {
    let newItems = items
    if (query) {
      const q = query.toLowerCase()
      newItems = newItems.filter(item => item.keywords.includes(q))
    }
    newItems = orderBy(newItems, sortKey, ascending ? 'asc' : 'desc')
    return newItems
  }, [items, sortKey, ascending, query])

  useEffect(() => {
    function onChange() {}
    world.entities.on('added', onChange)
    world.entities.on('removed', onChange)
    return () => {
      world.entities.off('added', onChange)
      world.entities.off('removed', onChange)
    }
  }, [])

  return {
    items: filtered,
    formatNumber,
  }
}
