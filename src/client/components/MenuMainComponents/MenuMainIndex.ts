import React from 'react'
import { useState } from 'react'
import { Menu, MenuItemText, MenuItemBtn } from '../Menu.js'
import { usePermissions } from '../usePermissions.js'

export function MenuMainIndex({  world, pop, push  }: any)) {
  const { isBuilder } = usePermissions(world)
  const player = world.entities.player
  const [name, setName] = useState(() => player.data.name)

  const changeName = name => {
    if (!name) return setName(player.data.name)
    player.modify({ name })
    world.network.send('entityModified', { id: player.data.id, name })
  }

  return (
    <Menu title='Menu'>
      <MenuItemText label='Name' hint='Change your display name' value={name} onChange={changeName} />
      <MenuItemBtn label='UI' hint='Change your interface settings' onClick={() => push('ui')} nav />
      <MenuItemBtn label='Graphics' hint='Change your device graphics settings' onClick={() => push('graphics')} nav />
      <MenuItemBtn label='Audio' hint='Change your audio volume' onClick={() => push('audio')} nav />
      {isBuilder && <MenuItemBtn label='World' hint='Modify world settings' onClick={() => push('world')} nav />}
      {isBuilder && (
        <MenuItemBtn label='Apps' hint='View all apps in the world' onClick={() => world.ui.toggleApps()} />
      )}
    </Menu>
  )
}
