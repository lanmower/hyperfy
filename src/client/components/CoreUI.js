import { css } from '@firebolt-dev/css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AvatarPane } from './AvatarPane.js'
import { useElemSize } from './useElemSize.js'
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
  useEffect(() => {
    world.on('ready', setReady)
    world.on('player', setPlayer)
    world.on('ui', setUI)
    world.on('menu', setMenu)
    world.on('confirm', setConfirm)
    world.on('code', setCode)
    world.on('apps', setApps)
    world.on('avatar', setAvatar)
    world.on('kick', setKicked)
    world.on('disconnect', setDisconnected)
    return () => {
      world.off('ready', setReady)
      world.off('player', setPlayer)
      world.off('ui', setUI)
      world.off('menu', setMenu)
      world.off('confirm', setConfirm)
      world.off('code', setCode)
      world.off('apps', setApps)
      world.off('avatar', setAvatar)
      world.off('kick', setKicked)
      world.off('disconnect', setDisconnected)
    }
  }, [])

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
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * world.prefs.ui}px`
    function onChange(changes) {
      if (changes.ui) {
        document.documentElement.style.fontSize = `${16 * world.prefs.ui}px`
      }
    }
    world.prefs.on('change', onChange)
    return () => {
      world.prefs.off('change', onChange)
    }
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
      {/* {ready && <Side world={world} player={player} menu={menu} />} */}
      {/* {ready && menu?.type === 'app' && code && (
        <CodeEditor key={`code-${menu.app.data.id}`} world={world} app={menu.app} blur={menu.blur} />
      )} */}
      {avatar && <AvatarPane key={avatar.hash} world={world} info={avatar} />}
      {/* {apps && <AppsPane world={world} close={() => world.ui.toggleApps()} />} */}
      {!ready && <LoadingOverlay world={world} />}
      {kicked && <KickedOverlay code={kicked} />}
      {ready && isTouch && <TouchBtns world={world} />}
      {ready && isTouch && <TouchStick world={world} />}
      {confirm && <Confirm options={confirm} />}
      <div id='core-ui-portal' />
    </div>
  )
}
