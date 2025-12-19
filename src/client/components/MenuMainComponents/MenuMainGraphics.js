import { Menu, MenuItemBack, MenuItemSwitch, MenuItemToggle } from '../Menu.js'
import { useGraphicsOptions } from '../hooks/useGraphicsOptions.js'
import { useSyncedState } from '../hooks/useSyncedState.js'

const shadowOptions = [
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Med', value: 'med' },
  { label: 'High', value: 'high' },
]

export function MenuMainGraphics({ world, pop, push }) {
  const dprOptions = useGraphicsOptions(world)
  const prefs = useSyncedState(world.prefs, ['dpr', 'shadows', 'postprocessing', 'bloom'])

  return (
    <Menu title='Menu'>
      <MenuItemBack hint='Go back to the main menu' onClick={pop} />
      <MenuItemSwitch
        label='Resolution'
        hint='Change your display resolution'
        options={dprOptions}
        value={prefs.dpr}
        onChange={dpr => world.prefs.setDPR(dpr)}
      />
      <MenuItemSwitch
        label='Shadows'
        hint='Change the quality of shadows in the world'
        options={shadowOptions}
        value={prefs.shadows}
        onChange={shadows => world.prefs.setShadows(shadows)}
      />
      <MenuItemToggle
        label='Postprocessing'
        hint='Enable or disable all postprocessing effects'
        trueLabel='On'
        falseLabel='Off'
        value={prefs.postprocessing}
        onChange={postprocessing => world.prefs.setPostprocessing(postprocessing)}
      />
      <MenuItemToggle
        label='Bloom'
        hint='Enable or disable the bloom effect'
        trueLabel='On'
        falseLabel='Off'
        value={prefs.bloom}
        onChange={bloom => world.prefs.setBloom(bloom)}
      />
    </Menu>
  )
}
