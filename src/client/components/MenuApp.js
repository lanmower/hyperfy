import { useEffect, useState } from 'react'
import { Menu } from './Menu.js'
import { MenuAppIndex } from './MenuAppComponents/MenuAppIndex.js'
import { MenuAppFlags } from './MenuAppComponents/MenuAppFlags.js'
import { MenuAppMetadata } from './MenuAppComponents/MenuAppMetadata.js'

export function MenuApp({ world, app, blur }) {
  const [pages, setPages] = useState(() => ['index'])
  const [blueprint, setBlueprint] = useState(app.blueprint)
  useEffect(() => {
    window.app = app
    const onModify = bp => {
      if (bp.id === blueprint.id) setBlueprint(bp)
    }
    world.blueprints.on('modify', onModify)
    return () => {
      world.blueprints.off('modify', onModify)
    }
  }, [])
  const pop = () => {
    const next = pages.slice()
    next.pop()
    setPages(next)
  }
  const push = page => {
    const next = pages.slice()
    next.push(page)
    setPages(next)
  }
  const page = pages[pages.length - 1]
  let Page
  if (page === 'index') Page = MenuAppIndex
  if (page === 'flags') Page = MenuAppFlags
  if (page === 'metadata') Page = MenuAppMetadata
  return (
    <Menu title={blueprint.name} blur={blur}>
      <Page world={world} app={app} blueprint={blueprint} pop={pop} push={push} />
    </Menu>
  )
}
