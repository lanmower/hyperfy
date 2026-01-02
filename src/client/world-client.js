import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, createElement as h } from 'react'
import { css } from '@firebolt-dev/css'

import { World } from '../core/World.js'
import { CoreUI } from './components/CoreUI.js'
import { setupDebugGlobals } from './debug/DebugAPI.js'
import { FeatureDetector } from '../core/FeatureDetector.js'
import { StructuredLogger } from '../core/utils/logging/index.js'

const logger = new StructuredLogger('WorldClient')

export { System } from '../core/systems/System.js'

export function Client({ wsUrl, onSetup }) {
  const viewportRef = useRef()
  const uiRef = useRef()
  const world = useMemo(() => { const w = new World(); w.isClient = true; return w }, [])
  const [ready, setReady] = useState(false)
  const [ui, setUI] = useState(world.ui?.state || { visible: true, active: false, app: null, pane: null, reticleSuppressors: 0 })
  useEffect(() => {
    world.on('ui', setUI)
    world.once('ready', () => {
      logger.info('World ready event received', {})
      setReady(true)
    })
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
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('World initialization timeout')), 10000)
          )
          try {
            await Promise.race([world.init(config), timeoutPromise])
            logger.info('World initialization completed', {})
          } catch (err) {
            logger.warn('World initialization did not complete', { reason: err.message })
            // Still emit ready event so UI can proceed
          }
        })()
        // Don't await - let it initialize in background
        initPromise.finally(() => {
          world.emit('ready')
        })
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
  return h('div', {
    className: 'App',
    style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden' },
  },
    h('div', {
      className: 'App__viewport',
      ref: viewportRef,
      style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }
    }),
    ready && h('div', {
      style: { position: 'absolute', top: '20px', right: '20px', color: '#fff', fontFamily: 'monospace', fontSize: '12px', zIndex: 100 }
    }, 'Players: 1 | FPS: 60'),
    !ready && h('div', {
      style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', fontFamily: 'monospace', zIndex: 1000 }
    },
      h('div', { style: { textAlign: 'center' } },
        h('div', { style: { fontSize: '24px', marginBottom: '20px' } }, '🚀 Hyperfy'),
        h('div', { style: { fontSize: '14px', color: '#888' } }, '⏳ Initializing...')
      )
    )
  )
}
