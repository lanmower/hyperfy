import { EarthIcon, LayersIcon, CirclePlusIcon } from 'lucide-react'
import { cls } from '../cls.js'

function Btn({ disabled, suspended, active, muted, children, ...props }) {
  return (
    <div className={cls('sidebar-btn', { disabled, suspended, active, muted })} {...props}>
      {children}
      <div className='sidebar-btn-dot' />
    </div>
  )
}

export function BuilderSection({ world, ui, activePane }) {
  return (
    <>
      <Btn
        active={activePane === 'world'}
        suspended={ui.pane === 'world' && !activePane}
        onClick={() => world.ui.togglePane('world')}
      >
        <EarthIcon size='1.25rem' />
      </Btn>
      <Btn
        active={activePane === 'apps'}
        suspended={ui.pane === 'apps' && !activePane}
        onClick={() => world.ui.togglePane('apps')}
      >
        <LayersIcon size='1.25rem' />
      </Btn>
      <Btn
        active={activePane === 'add'}
        suspended={ui.pane === 'add' && !activePane}
        onClick={() => world.ui.togglePane('add')}
      >
        <CirclePlusIcon size='1.25rem' />
      </Btn>
    </>
  )
}
