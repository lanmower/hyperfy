import { css } from '@firebolt-dev/css'
import { MenuIcon, MicIcon, MicOffIcon, VRIcon } from './Icons.js'
import { EarthIcon, LayersIcon, CirclePlusIcon, CodeIcon, ListTreeIcon, MessageSquareTextIcon, SquareMenuIcon, TagIcon, UsersIcon } from 'lucide-react'
import { cls } from './cls.js'
import { isTouch } from '../utils.js'

function Section({ active, top, bottom, children }) {
  return (
    <div
      className={cls('sidebar-section', { active, top, bottom })}
      css={css`
        background: rgba(11, 10, 21, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 2rem;
        padding: 0.6875rem 0;
        pointer-events: auto;
        position: relative;
        &.active { background: rgba(11, 10, 21, 0.9); }
      `}
    >
      {children}
    </div>
  )
}

function Btn({ disabled, suspended, active, muted, children, ...props }) {
  return (
    <div
      className={cls('sidebar-btn', { disabled, suspended, active, muted })}
      css={css`
        width: 2.75rem;
        height: 1.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
        .sidebar-btn-dot {
          display: none;
          position: absolute;
          top: 0.8rem;
          right: 0.2rem;
          width: 0.3rem;
          height: 0.3rem;
          border-radius: 0.15rem;
          background: white;
        }
        &:hover { cursor: pointer; color: white; }
        &.active { color: white; .sidebar-btn-dot { display: block; } }
        &.suspended { .sidebar-btn-dot { display: block; } }
        &.disabled { color: rgba(255, 255, 255, 0.3); }
        &.muted { color: #ff4b4b; }
      `}
      {...props}
    >
      {children}
      <div className='sidebar-btn-dot' />
    </div>
  )
}

function PaneBtn({ pane, activePane, ui, world, children }) {
  return (
    <Btn active={activePane === pane} suspended={ui.pane === pane && !activePane} onClick={() => world.ui.togglePane(pane)}>
      {children}
    </Btn>
  )
}

export function SidebarButtons({ world, ui, isBuilder, livekit, activePane }) {
  const paneProps = { activePane, ui, world }
  return (
    <div className='sidebar-sections'>
      <Section active={activePane} bottom>
        <PaneBtn pane='prefs' {...paneProps}><MenuIcon size='1.25rem' /></PaneBtn>
        <PaneBtn pane='players' {...paneProps}><UsersIcon size='1.25rem' /></PaneBtn>
        {isTouch && (
          <Btn onClick={() => world.emit('sidebar-chat-toggle')}><MessageSquareTextIcon size='1.25rem' /></Btn>
        )}
        {livekit.available && !livekit.connected && (
          <Btn disabled><MicOffIcon size='1.25rem' /></Btn>
        )}
        {livekit.available && livekit.connected && (
          <Btn muted={livekit.mic && (livekit.level === 'disabled' || livekit.muted)} onClick={() => world.livekit.setMicrophoneEnabled()}>
            {livekit.mic && livekit.level !== 'disabled' && !livekit.muted ? <MicIcon size='1.25rem' /> : <MicOffIcon size='1.25rem' />}
          </Btn>
        )}
        {world.xr.supportsVR && (
          <Btn onClick={() => world.xr.enter()}><VRIcon size='1.25rem' /></Btn>
        )}
      </Section>
      {isBuilder && (
        <Section active={activePane} top bottom>
          <PaneBtn pane='world' {...paneProps}><EarthIcon size='1.25rem' /></PaneBtn>
          <PaneBtn pane='apps' {...paneProps}><LayersIcon size='1.25rem' /></PaneBtn>
          <PaneBtn pane='add' {...paneProps}><CirclePlusIcon size='1.25rem' /></PaneBtn>
        </Section>
      )}
      {ui.app && (
        <Section active={activePane} top bottom>
          <PaneBtn pane='app' {...paneProps}><SquareMenuIcon size='1.25rem' /></PaneBtn>
          <PaneBtn pane='script' {...paneProps}><CodeIcon size='1.25rem' /></PaneBtn>
          <PaneBtn pane='nodes' {...paneProps}><ListTreeIcon size='1.25rem' /></PaneBtn>
          <PaneBtn pane='meta' {...paneProps}><TagIcon size='1.25rem' /></PaneBtn>
        </Section>
      )}
    </div>
  )
}
