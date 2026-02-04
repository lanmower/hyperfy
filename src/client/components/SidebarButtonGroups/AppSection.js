import { CodeIcon, ListTreeIcon, SquareMenuIcon, TagIcon } from 'lucide-react'
import { cls } from '../cls.js'

function Btn({ disabled, suspended, active, muted, children, ...props }) {
  return (
    <div className={cls('sidebar-btn', { disabled, suspended, active, muted })} {...props}>
      {children}
      <div className='sidebar-btn-dot' />
    </div>
  )
}

export function AppSection({ world, ui, activePane }) {
  return (
    <>
      <Btn
        active={activePane === 'app'}
        suspended={ui.pane === 'app' && !activePane}
        onClick={() => world.ui.togglePane('app')}
      >
        <SquareMenuIcon size='1.25rem' />
      </Btn>
      <Btn
        active={activePane === 'script'}
        suspended={ui.pane === 'script' && !activePane}
        onClick={() => world.ui.togglePane('script')}
      >
        <CodeIcon size='1.25rem' />
      </Btn>
      <Btn
        active={activePane === 'nodes'}
        suspended={ui.pane === 'nodes' && !activePane}
        onClick={() => world.ui.togglePane('nodes')}
      >
        <ListTreeIcon size='1.25rem' />
      </Btn>
      <Btn
        active={activePane === 'meta'}
        suspended={ui.pane === 'meta' && !activePane}
        onClick={() => world.ui.togglePane('meta')}
      >
        <TagIcon size='1.25rem' />
      </Btn>
    </>
  )
}
