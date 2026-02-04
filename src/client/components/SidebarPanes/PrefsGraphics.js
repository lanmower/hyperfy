import { FieldSwitch, FieldToggle } from '../Fields.js'
import { Group } from './Group.js'

const shadowOptions = [
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Med', value: 'med' },
  { label: 'High', value: 'high' },
]

export function PrefsGraphics({ world, prefs, dprOptions }) {
  return (
    <>
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
    </>
  )
}
