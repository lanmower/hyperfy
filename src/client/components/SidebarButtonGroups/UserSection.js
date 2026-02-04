import {
  MenuIcon,
  MicIcon,
  MicOffIcon,
  VRIcon,
} from '../Icons.js'
import { MessageSquareTextIcon, UsersIcon, HelpCircleIcon } from 'lucide-react'
import { cls } from '../cls.js'
import { isTouch } from '../../utils.js'

function Btn({ disabled, suspended, active, muted, children, ...props }) {
  return (
    <div className={cls('sidebar-btn', { disabled, suspended, active, muted })} {...props}>
      {children}
      <div className='sidebar-btn-dot' />
    </div>
  )
}

export function UserSection({ world, ui, livekit, activePane }) {
  return (
    <>
      <Btn
        active={activePane === 'prefs'}
        suspended={ui.pane === 'prefs' && !activePane}
        onClick={() => world.ui.togglePane('prefs')}
      >
        <MenuIcon size='1.25rem' />
      </Btn>
      <Btn
        active={activePane === 'controls'}
        suspended={ui.pane === 'controls' && !activePane}
        onClick={() => world.ui.togglePane('controls')}
      >
        <HelpCircleIcon size='1.25rem' />
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
      {world.xr?.supportsVR && (
        <Btn
          onClick={() => {
            world.xr.enter()
          }}
        >
          <VRIcon size='1.25rem' />
        </Btn>
      )}
    </>
  )
}
