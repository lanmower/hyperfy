import { Menu, MenuItemBack, MenuItemRange } from '../Menu.js'
import { useSyncedState } from '../hooks/useSyncedState.js'

export function MenuMainAudio({ world, pop, push }) {
  const prefs = useSyncedState(world.prefs, ['music', 'sfx', 'voice'])

  return (
    <Menu title='Menu'>
      <MenuItemBack hint='Go back to the main menu' onClick={pop} />
      <MenuItemRange
        label='Music'
        hint='Adjust general music volume'
        min={0}
        max={2}
        step={0.05}
        value={prefs.music}
        onChange={music => world.prefs.setMusic(music)}
      />
      <MenuItemRange
        label='SFX'
        hint='Adjust sound effects volume'
        min={0}
        max={2}
        step={0.05}
        value={prefs.sfx}
        onChange={sfx => world.prefs.setSFX(sfx)}
      />
      <MenuItemRange
        label='Voice'
        hint='Adjust global voice chat volume'
        min={0}
        max={2}
        step={0.05}
        value={prefs.voice}
        onChange={voice => world.prefs.setVoice(voice)}
      />
    </Menu>
  )
}
