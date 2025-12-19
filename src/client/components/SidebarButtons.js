import {
  MenuIcon,
  MicIcon,
  MicOffIcon,
  SettingsIcon,
  VRIcon,
} from './Icons.js'
import { EarthIcon, LayersIcon, CirclePlusIcon, CodeIcon, ListTreeIcon, MessageSquareTextIcon, SquareMenuIcon, TagIcon, UsersIcon } from 'lucide-react'
import { cls } from './cls.js'
import { isTouch } from '../utils.js'
import { sectionStyles, btnStyles } from './SidebarButtonStyles.js'

function Section({ active, top, bottom, children }) {
  return (
    <div className={cls('sidebar-section', { active, top, bottom })} css={sectionStyles}>
      {children}
    </div>
  )
}

function Btn({ disabled, suspended, active, muted, children, ...props }) {
  return (
    <div className={cls('sidebar-btn', { disabled, suspended, active, muted })} css={btnStyles} {...props}>
      {children}
      <div className='sidebar-btn-dot' />
    </div>
  )
}

export function SidebarButtons({ world, ui, isBuilder, livekit, activePane }) {
  return (
    <div className='sidebar-sections'>
      <Section active={activePane} bottom>
        <Btn
          active={activePane === 'prefs'}
          suspended={ui.pane === 'prefs' && !activePane}
          onClick={() => world.ui.togglePane('prefs')}
        >
          <MenuIcon size='1.25rem' />
        </Btn>
        <Btn
          active={activePane === 'players'}
          suspended={ui.pane === 'players' && !activePane}
          onClick={() => world.ui.togglePane('players')}
        >
          <UsersIcon size='1.25rem' />
        </Btn>
        {isTouch && (
          <Btn
            onClick={() => {
              world.emit('sidebar-chat-toggle')
            }}
          >
            <MessageSquareTextIcon size='1.25rem' />
          </Btn>
        )}
        {livekit.available && !livekit.connected && (
          <Btn disabled>
            <MicOffIcon size='1.25rem' />
          </Btn>
        )}
        {livekit.available && livekit.connected && (
          <Btn
            muted={livekit.mic && (livekit.level === 'disabled' || livekit.muted)}
            onClick={() => {
              world.livekit.setMicrophoneEnabled()
            }}
          >
            {livekit.mic && livekit.level !== 'disabled' && !livekit.muted ? (
              <MicIcon size='1.25rem' />
            ) : (
              <MicOffIcon size='1.25rem' />
            )}
          </Btn>
        )}
        {world.xr.supportsVR && (
          <Btn
            onClick={() => {
              world.xr.enter()
            }}
          >
            <VRIcon size='1.25rem' />
          </Btn>
        )}
      </Section>
      {isBuilder && (
        <Section active={activePane} top bottom>
          <Btn
            active={activePane === 'world'}
            suspended={ui.pane === 'world' && !activePane}
            onClick={() => world.ui.togglePane('world')}
          >
            <EarthIcon size='1.25rem' />
          </Btn>
          <Btn
            active={activePane === 'apps'}
            suspended={ui.pane === 'apps' && !activePane}
            onClick={() => world.ui.togglePane('apps')}
          >
            <LayersIcon size='1.25rem' />
          </Btn>
          <Btn
            active={activePane === 'add'}
            suspended={ui.pane === 'add' && !activePane}
            onClick={() => world.ui.togglePane('add')}
          >
            <CirclePlusIcon size='1.25rem' />
          </Btn>
        </Section>
      )}
      {ui.app && (
        <Section active={activePane} top bottom>
          <Btn
            active={activePane === 'app'}
            suspended={ui.pane === 'app' && !activePane}
            onClick={() => world.ui.togglePane('app')}
          >
            <SquareMenuIcon size='1.25rem' />
          </Btn>
          <Btn
            active={activePane === 'script'}
            suspended={ui.pane === 'script' && !activePane}
            onClick={() => world.ui.togglePane('script')}
          >
            <CodeIcon size='1.25rem' />
          </Btn>
          <Btn
            active={activePane === 'nodes'}
            suspended={ui.pane === 'nodes' && !activePane}
            onClick={() => world.ui.togglePane('nodes')}
          >
            <ListTreeIcon size='1.25rem' />
          </Btn>
          <Btn
            active={activePane === 'meta'}
            suspended={ui.pane === 'meta' && !activePane}
            onClick={() => world.ui.togglePane('meta')}
          >
            <TagIcon size='1.25rem' />
          </Btn>
        </Section>
      )}
    </div>
  )
}
