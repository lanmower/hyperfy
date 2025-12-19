import { Menu, MenuItemBack, MenuItemText, MenuItemFile, MenuItemNumber, MenuItemToggle, MenuItemBtn } from '../Menu.js'
import { usePermissions } from '../usePermissions.js'
import { useSyncedState } from '../hooks/useSyncedState.js'

export function MenuMainWorld({ world, pop, push }) {
  const { isAdmin } = usePermissions(world)
  const settings = useSyncedState(world.settings, ['title', 'desc', 'model', 'avatar', 'playerLimit', 'public'])

  return (
    <Menu title='Menu'>
      <MenuItemBack hint='Go back to the main menu' onClick={pop} />
      <MenuItemText
        label='Title'
        hint='Change the title of this world. Shown in the browser tab and when sharing links'
        placeholder='World'
        value={settings.title}
        onChange={value => world.settings.set('title', value, true)}
      />
      <MenuItemText
        label='Description'
        hint='Change the description of this world. Shown in previews when sharing links to this world'
        value={settings.desc}
        onChange={value => world.settings.set('desc', value, true)}
      />
      <MenuItemFile
        label='Environment'
        hint='Change the global environment model'
        kind='model'
        value={settings.model}
        onChange={value => world.settings.set('model', value, true)}
        world={world}
      />
      <MenuItemFile
        label='Avatar'
        hint='Change the default avatar everyone spawns into the world with'
        kind='avatar'
        value={settings.avatar}
        onChange={value => world.settings.set('avatar', value, true)}
        world={world}
      />
      <MenuItemNumber
        label='Player Limit'
        hint='Set a maximum number of players that can be in the world at one time. Zero means unlimited.'
        value={settings.playerLimit}
        onChange={value => world.settings.set('playerLimit', value, true)}
      />
      {isAdmin && (
        <MenuItemToggle
          label='Public'
          hint='Allow everyone to build (and destroy) things in the world. When disabled only admins can build.'
          value={settings.public}
          onChange={value => world.settings.set('public', value, true)}
        />
      )}
      <MenuItemBtn
        label='Set Spawn'
        hint='Sets the location players spawn to the location you are currently standing'
        onClick={() => {
          world.network.send('spawnModified', 'set')
        }}
      />
      <MenuItemBtn
        label='Clear Spawn'
        hint='Resets the spawn point to origin'
        onClick={() => {
          world.network.send('spawnModified', 'clear')
        }}
      />
    </Menu>
  )
}
