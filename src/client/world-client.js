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
  const [ui, setUI] = useState(() => {
    try {
      return world.ui?.state || { visible: true }
    } catch (e) {
      return { visible: true }
    }
  })
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

      if (!viewport || viewport.offsetWidth === 0) {
        console.warn('[WORLD-CLIENT] Viewport not ready, retrying...')
        setTimeout(init, 100)
        return
      }

      const baseEnvironment = {
        hdr: '/public/Clear_08_4pm_LDR.hdr',
        sky: '/public/day2-2k.jpg',
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
      console.log('[WORLD-CLIENT] Config being passed to world.init:', { wsUrl, hasUrl: !!wsUrl, assetsUrl: config.assetsUrl, vpWidth: viewport.offsetWidth, vpHeight: viewport.offsetHeight })
      onSetup?.(world, config)
      await world.init(config)

      console.log('[WORLD-CLIENT] World initialized, starting graphics...')
      if (world.graphics && world.graphics.startApp) {
        world.graphics.startApp()
      }

      console.log('[WORLD-CLIENT] About to set up RAF loop')
      const tick = (time) => {
        try {
          world.tick(time)
        } catch (err) {
          console.error('[WORLD-CLIENT] Error in world.tick:', err)
          return
        }
        try {
          requestAnimationFrame(tick)
        } catch (err) {
          console.error('[WORLD-CLIENT] Error in requestAnimationFrame:', err)
        }
      }
      console.log('[WORLD-CLIENT] Calling requestAnimationFrame for first time')
      requestAnimationFrame(tick)
      console.log('[WORLD-CLIENT] requestAnimationFrame called successfully')
    }
    init().catch(err => {
      console.error('[WORLD-CLIENT] Init error:', err)
    })
  }, [])
  try {
    return (
      <div
        className='App'
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100vh',
        }}
      >
        <div
          className='App__viewport'
          ref={viewportRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div
            className='App__ui'
            ref={uiRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              userSelect: 'none',
              display: ui?.visible !== false ? 'block' : 'none',
            }}
          >
            {world.ui ? <CoreUI world={world} /> : null}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[CLIENT] Render error:', err)
    return <div style={{ width: '100%', height: '100%', backgroundColor: '#f00', color: '#fff' }}>Error: {err.message}</div>
  }
}
