import { FieldRange, FieldToggle, FieldBtn } from '../Fields.js'
import { Group } from './Group.js'
import { isTouch } from '../../utils.js'

export function PrefsInterface({ world, prefs, isFullscreen, toggleFullscreen, isBuilder }) {
  return (
    <>
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
    </>
  )
}
