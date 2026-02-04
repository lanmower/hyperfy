import { isBoolean } from '../../../core/utils/helpers/typeChecks.js'
import { MenuItemBack, MenuItemToggle } from '../Menu.js'

export function MenuAppFlags({ world, app, blueprint, pop, push }) {
  const toggle = async (key, value) => {
    value = isBoolean(value) ? value : !blueprint[key]
    if (blueprint[key] === value) return
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, [key]: value })
    world.network.send('blueprintModified', { id: blueprint.id, version, [key]: value })
  }

  return (
    <>
      <MenuItemBack hint='Go back to the main app details' onClick={pop} />
      <MenuItemToggle
        label='Preload'
        hint='Preload this app before players enter the world'
        value={blueprint.preload}
        onChange={value => toggle('preload', value)}
      />
      <MenuItemToggle
        label='Lock'
        hint='Lock the app so that after downloading it the model, script and metadata can no longer be edited'
        value={blueprint.locked}
        onChange={value => toggle('locked', value)}
      />
      <MenuItemToggle
        label='Unique'
        hint='When duplicating this app in the world, create a completely new and unique instance with its own separate config'
        value={blueprint.unique}
        onChange={value => toggle('unique', value)}
      />
    </>
  )
}
