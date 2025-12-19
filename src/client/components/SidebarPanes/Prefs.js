import { FieldText } from '../Fields.js'
import { useState } from 'react'
import { useFullscreen } from '../useFullscreen.js'
import { useRank } from '../useRank.js'
import { Pane } from './Pane.js'
import { useSyncedState } from '../hooks/index.js'
import { useGraphicsOptions } from '../hooks/index.js'
import { prefsStyles } from './SidebarStyles.js'
import { PrefsInterface } from './PrefsInterface.js'
import { PrefsGraphics } from './PrefsGraphics.js'
import { PrefsAudio } from './PrefsAudio.js'

export function Prefs({ world, hidden }) {
  const player = world.entities.player
  const { isAdmin, isBuilder } = useRank(world, player)
  const [name, setName] = useState(() => player.data.name)
  const [canFullscreen, isFullscreen, toggleFullscreen] = useFullscreen()
  const dprOptions = useGraphicsOptions(world)

  const prefs = useSyncedState(world.prefs, [
    'dpr', 'shadows', 'postprocessing', 'bloom', 'ao', 'music', 'sfx', 'voice', 'ui', 'actions', 'stats'
  ])

  const changeName = name => {
    if (!name) return setName(player.data.name)
    player.setName(name)
  }

  return (
    <Pane hidden={hidden}>
      <div className='prefs noscrollbar' css={prefsStyles}>
        <FieldText label='Name' hint='Change your name' value={name} onChange={changeName} />
        <PrefsInterface
          world={world}
          prefs={prefs}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          isBuilder={isBuilder}
        />
        <PrefsGraphics
          world={world}
          prefs={prefs}
          dprOptions={dprOptions}
        />
        <PrefsAudio
          world={world}
          prefs={prefs}
        />
      </div>
    </Pane>
  )
}
