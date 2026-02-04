import React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { cls } from '../cls.js'
import { useAppStats } from '../hooks/useAppStats.js'
import { EntityTargeting } from './EntityTargeting.js'
import { AppActions } from './AppActions.js'
import { contentStyles } from '../styles/ComponentStyles.js'
import { TableHeader } from './TableHeader.js'
import { TableRow } from './TableRow.js'

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
      <TableHeader sort={sort} reorder={reorder} />
      <div className='appslist-rows'>
        {items.map(item => (
          <TableRow
            key={item.blueprint.id}
            item={item}
            entityTargeting={entityTargeting}
            onInspect={handleInspect}
            onToggle={handleToggle}
            onToggleTarget={handleToggleTarget}
          />
        ))}
      </div>
    </div>
  )
}
