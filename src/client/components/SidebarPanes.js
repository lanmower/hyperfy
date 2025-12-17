

import { Prefs } from './SidebarPanes/Prefs.js'
import { World } from './SidebarPanes/World.js'
import { Apps } from './SidebarPanes/Apps.js'
import { Add } from './SidebarPanes/Add.js'
import { App } from './SidebarPanes/App.js'
import { Script } from './SidebarPanes/Script.js'
import { Nodes } from './SidebarPanes/Nodes.js'
import { Meta } from './SidebarPanes/Meta.js'
import { Players } from './SidebarPanes/Players.js'

export function SidebarPanes({ world, ui }) {
  return (
    <>
      {ui.pane === 'prefs' && <Prefs world={world} hidden={!ui.active} />}
      {ui.pane === 'world' && <World world={world} hidden={!ui.active} />}
      {ui.pane === 'apps' && <Apps world={world} hidden={!ui.active} />}
      {ui.pane === 'add' && <Add world={world} hidden={!ui.active} />}
      {ui.pane === 'app' && <App key={ui.app.data.id} world={world} hidden={!ui.active} />}
      {ui.pane === 'script' && <Script key={ui.app.data.id} world={world} hidden={!ui.active} />}
      {ui.pane === 'nodes' && <Nodes key={ui.app.data.id} world={world} hidden={!ui.active} />}
      {ui.pane === 'meta' && <Meta key={ui.app.data.id} world={world} hidden={!ui.active} />}
      {ui.pane === 'players' && <Players world={world} hidden={!ui.active} />}
    </>
  )
}
