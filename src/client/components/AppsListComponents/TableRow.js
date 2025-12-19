import { CrosshairIcon, OctagonXIcon } from 'lucide-react'
import { cls } from '../cls.js'
import { formatNumber } from '../hooks/useAppStats.js'

export function TableRow({ item, entityTargeting, onInspect, onToggle, onToggleTarget }) {
  return (
    <div key={item.blueprint.id} className='appslist-row'>
      <div className='appslist-rowitem name' onClick={() => onInspect(item)}>
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
              onClick={() => onToggle(item)}
            >
              <OctagonXIcon size='1rem' />
            </div>
            <div
              className={cls('appslist-action', { active: entityTargeting.isTargeting(item) })}
              onClick={() => onToggleTarget(item)}
            >
              <CrosshairIcon size='1rem' />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
