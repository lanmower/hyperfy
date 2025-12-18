import { css } from '@firebolt-dev/css'
import { FieldRange, FieldSwitch, FieldText, FieldToggle, FieldBtn } from '../Fields.js'
import { useState } from 'react'
import { useFullscreen } from '../useFullscreen.js'
import { useRank } from '../useRank.js'
import { Pane } from './Pane.js'
import { Group } from './Group.js'
import { isTouch } from '../../utils.js'
import { useSyncedState } from '../hooks/index.js'
import { useGraphicsOptions } from '../hooks/index.js'

const shadowOptions = [
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Med', value: 'med' },
  { label: 'High', value: 'high' },
]

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
      <div
        className='prefs noscrollbar'
        css={css`
          overflow-y: auto;
          background: rgba(11, 10, 21, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.375rem;
          padding: 0.6rem 0;
        `}
      >
        <FieldText label='Name' hint='Change your name' value={name} onChange={changeName} />
        <Group label='Interface' />
        <FieldRange
          label='Scale'
          hint='Change the scale of the user interface'
          min={0.5}
          max={1.5}
          step={0.1}
          value={prefs.ui}
          onChange={ui => world.prefs.setUI(ui)}
        />
        <FieldToggle
          label='Fullscreen'
          hint='Toggle fullscreen. Not supported in some browsers'
          value={isFullscreen}
          onChange={value => toggleFullscreen(value)}
          trueLabel='Enabled'
          falseLabel='Disabled'
        />
        {isBuilder && (
          <FieldToggle
            label='Build Prompts'
            hint='Show or hide action prompts when in build mode'
            value={prefs.actions}
            onChange={actions => world.prefs.setActions(actions)}
            trueLabel='Visible'
            falseLabel='Hidden'
          />
        )}
        <FieldToggle
          label='Stats'
          hint='Show or hide performance stats'
          value={prefs.stats}
          onChange={stats => world.prefs.setStats(stats)}
          trueLabel='Visible'
          falseLabel='Hidden'
        />
        {!isTouch && (
          <FieldBtn
            label='Hide Interface'
            note='Z'
            hint='Hide the user interface. Press Z to re-enable.'
            onClick={() => world.ui.toggleVisible()}
          />
        )}
        <Group label='Graphics' />
        <FieldSwitch
          label='Resolution'
          hint='Change your display resolution'
          options={dprOptions}
          value={prefs.dpr}
          onChange={dpr => world.prefs.setDPR(dpr)}
        />
        <FieldSwitch
          label='Shadows'
          hint='Change the quality of shadows in the world'
          options={shadowOptions}
          value={prefs.shadows}
          onChange={shadows => world.prefs.setShadows(shadows)}
        />
        <FieldToggle
          label='Post-processing'
          hint='Enable or disable all postprocessing effects'
          trueLabel='On'
          falseLabel='Off'
          value={prefs.postprocessing}
          onChange={postprocessing => world.prefs.setPostprocessing(postprocessing)}
        />
        <FieldToggle
          label='Bloom'
          hint='Enable or disable the bloom effect'
          trueLabel='On'
          falseLabel='Off'
          value={prefs.bloom}
          onChange={bloom => world.prefs.setBloom(bloom)}
        />
        {world.settings.ao && (
          <FieldToggle
            label='Ambient Occlusion'
            hint='Enable or disable the ambient occlusion effect'
            trueLabel='On'
            falseLabel='Off'
            value={prefs.ao}
            onChange={ao => world.prefs.setAO(ao)}
          />
        )}
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
      </div>
    </Pane>
  )
}
