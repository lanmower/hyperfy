import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'

import { World } from '../core/World.js'
import { CoreUI } from './components/CoreUI.js'
import { setupDebugGlobals } from './debugUtils.js'
import { FeatureDetector } from '../core/FeatureDetector.js'
import { ComponentLogger } from '../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('WorldClient')

export { System } from '../core/systems/System.js'

export function Client({ wsUrl, onSetup }) {
  const viewportRef = useRef()
  const uiRef = useRef()
  const world = useMemo(() => { const w = new World(); w.isClient = true; return w }, [])
  const [ui, setUI] = useState(world.ui?.state || { visible: true, active: false, app: null, pane: null, reticleSuppressors: 0 })
  useEffect(() => {
    world.on('ui', setUI)
    return () => {
      world.off('ui', setUI)
    }
  }, [])
  useEffect(() => {
    const init = async () => {
      try {
        logger.info('World initialization started', {})

        const featureDetector = new FeatureDetector()
        const features = await featureDetector.detect()
        const capabilities = featureDetector.getCapabilities()

        logger.info('Client feature detection complete', { capabilities })

        if (!capabilities.canRender3D) {
          logger.error('WebGL not supported - cannot render 3D content', {})
          return
        }

        if (!capabilities.canUseWebSocket) {
          logger.warn('WebSocket not supported - entering offline mode', {})
        }

        world.features = features
        world.capabilities = capabilities

        const viewport = viewportRef.current
        const ui = uiRef.current
        const baseEnvironment = {
          model: '/base-environment.glb',
          bg: null,
          hdr: '/Clear_08_4pm_LDR.hdr',
          rotationY: 0,
          sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
          sunIntensity: 1,
          sunColor: 0xffffff,
          fogNear: null,
          fogFar: null,
          fogColor: null,
        }
        if (typeof wsUrl === 'function') {
          wsUrl = wsUrl()
          if (wsUrl instanceof Promise) wsUrl = await wsUrl
        }
        const config = { viewport, ui, wsUrl, baseEnvironment, assetsUrl: '/assets', capabilities }
        logger.info('Calling onSetup and initializing debug globals', {})
        onSetup?.(world, config)
        setupDebugGlobals(world)
        const initPromise = (async () => {
          logger.info('Starting world initialization', {})
          await world.init(config)
          logger.info('World initialization completed', {})
        })()
        await initPromise
        const tick = time => {
          world.tick(time)
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      } catch (err) {
        logger.error('World initialization error', { error: err.message })
        logger.error('Unable to start application - check logs for details', {})
      }
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
