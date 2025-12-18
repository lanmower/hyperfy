import { css } from '@firebolt-dev/css'
import { useEffect, useRef, useState } from 'react'
import { AvatarPane } from './AvatarPane.js'
import { isTouch } from '../utils.js'
import { Sidebar } from './Sidebar.js'
import { ActionsBlock } from './CoreUIComponents/ActionsBlock.js'
import { Chat } from './CoreUIComponents/Chat.js'
import { Confirm } from './CoreUIComponents/Confirm.js'
import { Disconnected } from './CoreUIComponents/Disconnected.js'
import { KickedOverlay } from './CoreUIComponents/KickedOverlay.js'
import { LoadingOverlay } from './CoreUIComponents/LoadingOverlay.js'
import { Reticle } from './CoreUIComponents/Reticle.js'
import { Toast } from './CoreUIComponents/Toast.js'
import { TouchBtns } from './CoreUIComponents/TouchBtns.js'
import { TouchStick } from './CoreUIComponents/TouchStick.js'
import { useWorldEvents, usePrefsChange } from './hooks/index.js'

export function CoreUI({ world }) {
  const ref = useRef()
  const [ready, setReady] = useState(false)
  const [player, setPlayer] = useState(() => world.entities.player)
  const [ui, setUI] = useState(world.ui.state)
  const [menu, setMenu] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [code, setCode] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const [disconnected, setDisconnected] = useState(false)
  const [apps, setApps] = useState(false)
  const [kicked, setKicked] = useState(null)
  useWorldEvents(world, {
    ready: setReady, player: setPlayer, ui: setUI, menu: setMenu,
    confirm: setConfirm, code: setCode, apps: setApps, avatar: setAvatar,
    kick: setKicked, disconnect: setDisconnected
  })

  useEffect(() => {
    const elem = ref.current
    const onEvent = e => {
      e.isCoreUI = true
    }
    elem.addEventListener('wheel', onEvent)
    elem.addEventListener('click', onEvent)
    elem.addEventListener('pointerdown', onEvent)
    elem.addEventListener('pointermove', onEvent)
    elem.addEventListener('pointerup', onEvent)
    elem.addEventListener('touchstart', onEvent)
  }, [])
  usePrefsChange(world, changes => {
    if (changes.ui) document.documentElement.style.fontSize = `${16 * world.prefs.ui}px`
  })
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * world.prefs.ui}px`
  }, [])
  return (
    <div
      ref={ref}
      className='coreui'
      css={css`
        position: absolute;
        inset: 0;
        overflow: hidden;
      `}
    >
      {disconnected && <Disconnected />}
      {!ui.reticleSuppressors && <Reticle world={world} />}
      {<Toast world={world} />}
      {ready && <ActionsBlock world={world} />}
      {ready && <Sidebar world={world} ui={ui} />}
      {ready && <Chat world={world} />}
      {}
      {}
      {avatar && <AvatarPane key={avatar.hash} world={world} info={avatar} />}
      {}
      {!ready && <LoadingOverlay world={world} />}
      {kicked && <KickedOverlay code={kicked} />}
      {ready && isTouch && <TouchBtns world={world} />}
      {ready && isTouch && <TouchStick world={world} />}
      {confirm && <Confirm options={confirm} />}
      <div id='core-ui-portal' />
    </div>
  )
}
