import { FieldRange } from '../Fields.js'
import { Group } from './Group.js'

export function PrefsAudio({ world, prefs }) {
  return (
    <>
      <Group label='Audio' />
      <FieldRange
        label='Music'
        hint='Adjust general music volume'
        min={0}
        max={2}
        step={0.05}
        value={prefs.music}
        onChange={music => world.prefs.setMusic(music)}
      />
      <FieldRange
        label='SFX'
        hint='Adjust sound effects volume'
        min={0}
        max={2}
        step={0.05}
        value={prefs.sfx}
        onChange={sfx => world.prefs.setSFX(sfx)}
      />
      <FieldRange
        label='Voice'
        hint='Adjust global voice chat volume'
        min={0}
        max={2}
        step={0.05}
        value={prefs.voice}
        onChange={voice => world.prefs.setVoice(voice)}
      />
    </>
  )
}
