import React from 'react'
import { FieldFile, FieldNumber, FieldSwitch, FieldText, FieldToggle } from '../Fields.js'
import { useRank } from '../useRank.js'
import { Ranks } from '../../../core/extras/ranks.js'
import { Pane } from './Pane.js'
import { Group } from './Group.js'
import { useSyncedState } from '../hooks/index.js'
import { worldStyles } from './SidebarStyles.js'

const voiceChatOptions = [
  { label: 'Disabled', value: 'disabled' },
  { label: 'Spatial', value: 'spatial' },
  { label: 'Global', value: 'global' },
]

export function World({ world, hidden }) {
  const player = world.entities.player
  const { isAdmin } = useRank(world, player)

  const settings = useSyncedState(world.settings, [
    'title', 'desc', 'image', 'avatar', 'customAvatars', 'voice', 'playerLimit', 'ao', 'rank'
  ])

  return (
    <Pane hidden={hidden}>
      <div className='world' css={worldStyles}>
        <div className='world-head'>
          <div className='world-title'>World</div>
        </div>
        <div className='world-content noscrollbar'>
          <FieldText
            label='Title'
            hint='Change the title of this world. Shown in the browser tab and when sharing links'
            placeholder='World'
            value={settings.title}
            onChange={value => world.settings.set('title', value, true)}
          />
          <FieldText
            label='Description'
            hint='Change the description of this world. Shown in previews when sharing links to this world'
            value={settings.desc}
            onChange={value => world.settings.set('desc', value, true)}
          />
          <FieldFile
            label='Image'
            hint='Change the image of the world. This is shown when loading into or sharing links to this world.'
            kind='image'
            value={settings.image}
            onChange={value => world.settings.set('image', value, true)}
            world={world}
          />
          <FieldFile
            label='Avatar'
            hint='Change the default avatar everyone spawns into the world with'
            kind='avatar'
            value={settings.avatar}
            onChange={value => world.settings.set('avatar', value, true)}
            world={world}
          />
          {isAdmin && world.settings.hasAdminCode && (
            <FieldToggle
              label='Custom Avatars'
              hint='Allow visitors to drag and drop custom VRM avatars.'
              trueLabel='On'
              falseLabel='Off'
              value={settings.customAvatars}
              onChange={value => world.settings.set('customAvatars', value, true)}
            />
          )}
          <FieldSwitch
            label='Voice Chat'
            hint='Set the base voice chat mode. Apps are able to modify this using custom rules.'
            options={voiceChatOptions}
            value={settings.voice}
            onChange={voice => world.settings.set('voice', voice, true)}
          />
          <FieldNumber
            label='Player Limit'
            hint='Set a maximum number of players that can be in the world at one time. Zero means unlimited.'
            value={settings.playerLimit}
            onChange={value => world.settings.set('playerLimit', value, true)}
          />
          <FieldToggle
            label='Ambient Occlusion'
            hint={`Improves visuals by approximating darkened corners etc. When enabled, users also have an option to disable this on their device for performance.`}
            trueLabel='On'
            falseLabel='Off'
            value={settings.ao}
            onChange={value => world.settings.set('ao', value, true)}
          />
          {isAdmin && world.settings.hasAdminCode && (
            <FieldToggle
              label='Free Build'
              hint='Allow everyone to build (and destroy) things in the world.'
              trueLabel='On'
              falseLabel='Off'
              value={settings.rank >= Ranks.BUILDER}
              onChange={value => world.settings.set('rank', value ? Ranks.BUILDER : Ranks.VISITOR, true)}
            />
          )}
        </div>
      </div>
    </Pane>
  )
}
