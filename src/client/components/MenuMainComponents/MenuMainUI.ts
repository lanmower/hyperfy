import React from 'react'
import { useState } from 'react'
import { Menu, MenuItemBack, MenuItemRange, MenuItemToggle } from '../Menu.js'
import { usePermissions } from '../usePermissions.js'
import { useFullscreen } from '../useFullscreen.js'
import { useSyncedState } from '../hooks/useSyncedState.js'

export function MenuMainUI({ world, pop, push }) {
  const [canFullscreen, isFullscreen, toggleFullscreen] = useFullscreen()
  const prefs = useSyncedState(world.prefs, ['ui', 'actions', 'stats'])
  const { isBuilder } = usePermissions(world)

  return (
    <Menu title='Menu'>
      <MenuItemBack hint='Go back to the main menu' onClick={pop} />
      <MenuItemToggle
        label='Fullscreen'
        hint='Toggle fullscreen. Not supported in some browsers'
        value={isFullscreen}
        onChange={value => toggleFullscreen(value)}
      />
      <MenuItemRange
        label='UI Scale'
        hint='Change the scale of the user interface'
        min={0.5}
        max={1.5}
        step={0.1}
        value={prefs.ui}
        onChange={ui => world.prefs.setUI(ui)}
      />
      {isBuilder && (
        <MenuItemToggle
          label='Build Prompts'
          hint='Show or hide action prompts when in build mode'
          value={prefs.actions}
          onChange={actions => world.prefs.setActions(actions)}
        />
      )}
      <MenuItemToggle
        label='Stats'
        hint='Show or hide performance stats'
        value={prefs.stats}
        onChange={stats => world.prefs.setStats(stats)}
      />
    </Menu>
  )
}
