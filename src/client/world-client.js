import { useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'

import { createClientWorld } from '../core/createClientWorld.js'
import { CoreUI } from './components/CoreUI.js'

export { System } from '../core/systems/System.js'

export function Client({ wsUrl, onSetup }) {
  console.log('[CLIENT_COMPONENT] Rendering Client component')
  const viewportRef = useRef()
  const uiRef = useRef()
  const world = useMemo(() => {
    console.log('[USEMEMO] Creating client world')
    return createClientWorld()
  }, [])
  const [ui, setUI] = useState(world.ui.state)
  useEffect(() => {
    world.on('ui', setUI)
    return () => {
      world.off('ui', setUI)
    }
  }, [])
  useEffect(() => {
    const init = async () => {
      const viewport = viewportRef.current
      const ui = uiRef.current
      const baseEnvironment = {
        model: '/base-environment.glb',
        bg: null,
        hdr: '/assets/62db0ffbcea86b5e9ba23fb5da739b160e8abfd3b390235fed5ac436750e1e2e.hdr',
        sky: '/assets/179d71586e675efc4af04185e1b2d3e6b7f4a5b707f1ef5e9b6497c5660ecab7.webp',
        rotationY: 0,
        sunDirection: [-1, -2, -2],
        sunIntensity: 1,
        sunColor: [1, 1, 1],
        fogNear: null,
        fogFar: null,
        fogColor: null,
      }
      if (typeof wsUrl === 'function') {
        wsUrl = wsUrl()
        if (wsUrl instanceof Promise) wsUrl = await wsUrl
      }
      const config = { viewport, ui, wsUrl, baseEnvironment, assetsUrl: window.env?.PUBLIC_ASSETS_URL || '/assets' }
      console.log('[WORLD-CLIENT] Config being passed to world.init:', { wsUrl, hasUrl: !!wsUrl, assetsUrl: config.assetsUrl })
      onSetup?.(world, config)
      await world.init(config)

      const tick = (time) => {
        world.tick(time)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    init()
  }, [])
  return (
    <div
      className='App'
      css={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100vh;
        height: 100dvh;
        .App__viewport {
          position: absolute;
          inset: 0;
        }
        .App__ui {
          position: absolute;
          inset: 0;
          pointer-events: none;
          user-select: none;
          display: ${ui.visible ? 'block' : 'none'};
        }
      `}
    >
      <div className='App__viewport' ref={viewportRef}>
        <div className='App__ui' ref={uiRef}>
          <CoreUI world={world} />
        </div>
      </div>
    </div>
  )
}
