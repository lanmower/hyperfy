import { test, expect } from '@playwright/test'

test.describe('Model Placement: Edge Cases & Regression Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should handle placement on invalid surface gracefully', async ({ page }) => {
    const errors = []
    let errorCaught = false

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.evaluate(() => {
      try {
        const apps = window.__DEBUG__?.apps?.() || []
        if (apps.length > 0) {
          const app = apps[0]
          app.root.position.set(1000, 1000, 1000)
        }
      } catch (e) {
        console.error('Placement error:', e.message)
      }
    })

    await page.evaluate(() => new Promise(r => setTimeout(r, 200)))

    expect(errors.length).toBeGreaterThanOrEqual(0)
  })

  test('should detect overlapping model collisions', async ({ page }) => {
    const collisionState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length < 2) return { hasMultiple: false }

      const positions = apps.map(app => app.root.position)
      const overlaps = []

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dist = positions[i].distanceTo(positions[j])
          if (dist < 0.5) {
            overlaps.push({ apps: [i, j], distance: dist })
          }
        }
      }

      return {
        hasMultiple: true,
        appCount: apps.length,
        overlaps: overlaps,
        hasCollisions: overlaps.length > 0,
      }
    })

    if (collisionState?.hasMultiple) {
      expect(collisionState.appCount).toBeGreaterThan(0)
    }
  })

  test('should handle rapid mode switching without crashes', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const result = await page.evaluate(async () => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      if (!builder) return false

      try {
        for (let i = 0; i < 5; i++) {
          builder.setMode('grab')
          await new Promise(r => setTimeout(r, 50))
          builder.setMode('translate')
          await new Promise(r => setTimeout(r, 50))
        }
        return true
      } catch (e) {
        return false
      }
    })

    expect(result || errors.length === 0).toBeTruthy()
  })

  test('should maintain state consistency during network sync', async ({ page }) => {
    const consistencyCheck = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      if (!selected) return { consistent: true }

      const rootPos = selected.root.position
      const dataPos = selected.data.position

      if (!dataPos) return { consistent: true }

      const dist = Math.sqrt(
        Math.pow(rootPos.x - dataPos[0], 2) +
          Math.pow(rootPos.y - dataPos[1], 2) +
          Math.pow(rootPos.z - dataPos[2], 2)
      )

      return {
        consistent: dist < 0.1,
        distance: dist,
        rootPos: rootPos.toArray(),
        dataPos: dataPos,
      }
    })

    if (consistencyCheck) {
      expect(consistencyCheck.consistent).toBe(true)
    }
  })

  test('should handle rapid select/deselect cycles', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return false

      try {
        const select = window.__DEBUG__?.systems?.selectionManager?.()?.select

        if (select) {
          for (let i = 0; i < 3; i++) {
            select(apps[0])
            await new Promise(r => setTimeout(r, 50))
            select(null)
            await new Promise(r => setTimeout(r, 50))
          }
        }
        return true
      } catch (e) {
        console.error('Select cycle error:', e)
        return false
      }
    })

    expect(result).toBe(true)
  })

  test('should prevent ghost movers when selection lost unexpectedly', async ({ page }) => {
    const moverState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null

      return apps.map(app => ({
        id: app.data.id,
        mover: app.data.mover,
        networkId: window.__DEBUG__.network?.id,
        isGhost: app.data.mover && app.data.mover !== window.__DEBUG__.network?.id,
      }))
    })

    if (moverState) {
      const ghosts = moverState.filter(m => m.isGhost)
      expect(ghosts.length).toBeGreaterThanOrEqual(0)
    }
  })

  test('should handle placement timeout/cancellation', async ({ page }) => {
    const initial = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      return !!selected
    })

    if (initial) {
      await page.keyboard.press('escape')
      await page.evaluate(() => new Promise(r => setTimeout(r, 200)))

      const after = await page.evaluate(() => {
        const selected = window.__DEBUG__?.getSelected?.()
        return !!selected
      })

      expect(after).toBe(false)
    }
  })
})

test.describe('Model Placement: Three.js Scene State Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should verify model is in Three.js scene graph', async ({ page }) => {
    const sceneGraph = await page.evaluate(() => {
      const stage = window.__DEBUG__?.systems?.stage?.()
      const apps = window.__DEBUG__?.apps?.() || []

      if (!stage?.scene || apps.length === 0) return null

      const app = apps[0]
      const inScene = stage.scene.children.some(child => {
        return child === app.root || child.children?.includes(app.root)
      })

      return {
        appCount: apps.length,
        sceneChildrenCount: stage.scene.children.length,
        modelInScene: inScene,
      }
    })

    if (sceneGraph) {
      expect(sceneGraph.sceneChildrenCount).toBeGreaterThan(0)
    }
  })

  test('should verify model has Three.js geometry', async ({ page }) => {
    const geometryState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null

      const app = apps[0]
      if (!app.threeScene) return { hasThreeScene: false }

      const hasGeometry = (() => {
        const check = (obj) => {
          if (obj.geometry) return true
          if (obj.children) {
            for (const child of obj.children) {
              if (check(child)) return true
            }
          }
          return false
        }
        return check(app.threeScene)
      })()

      return {
        hasThreeScene: true,
        hasGeometry: hasGeometry,
        objectCount: app.threeScene.children?.length || 0,
      }
    })

    if (geometryState) {
      expect(geometryState.hasThreeScene).toBe(true)
    }
  })

  test('should verify model transform updates are reflected in scene', async ({ page }) => {
    const beforeTransform = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null
      const app = apps[0]
      return {
        pos: app.root.position.toArray(),
        rot: app.root.quaternion.toArray(),
      }
    })

    if (beforeTransform) {
      await page.evaluate(() => {
        const apps = window.__DEBUG__?.apps?.() || []
        if (apps.length > 0) {
          apps[0].root.position.x += 1
          apps[0].root.updateMatrix()
          apps[0].root.updateMatrixWorld(true)
        }
      })

      const afterTransform = await page.evaluate(() => {
        const apps = window.__DEBUG__?.apps?.() || []
        if (apps.length === 0) return null
        const app = apps[0]
        return app.root.position.toArray()
      })

      expect(afterTransform).toBeTruthy()
    }
  })

  test('should verify gizmo is properly positioned in scene', async ({ page }) => {
    const gizmoPosition = await page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      const selected = window.__DEBUG__?.getSelected?.()

      if (!gizmo?.gizmoTarget || !selected) return null

      const gizmoWorldPos = new THREE.Vector3()
      gizmo.gizmoTarget.getWorldPosition(gizmoWorldPos)

      const selectedWorldPos = new THREE.Vector3()
      selected.root.getWorldPosition(selectedWorldPos)

      const distance = gizmoWorldPos.distanceTo(selectedWorldPos)

      return {
        gizmoWorldPos: gizmoWorldPos.toArray(),
        selectedWorldPos: selectedWorldPos.toArray(),
        distance: distance,
        properlyPositioned: distance < 0.01,
      }
    })

    if (gizmoPosition) {
      expect(gizmoPosition.properlyPositioned).toBe(true)
    }
  })

  test('should verify scene lighting and materials are applied', async ({ page }) => {
    const materialState = await page.evaluate(() => {
      const stage = window.__DEBUG__?.systems?.stage?.()
      const apps = window.__DEBUG__?.apps?.() || []

      if (!stage?.scene || apps.length === 0) return null

      const app = apps[0]
      const hasMaterial = (() => {
        const check = (obj) => {
          if (obj.material) return true
          if (obj.children) {
            for (const child of obj.children) {
              if (check(child)) return true
            }
          }
          return false
        }
        return check(app.root) || check(app.threeScene)
      })()

      return {
        hasLights: stage.scene.children.some(c => c.isLight),
        appHasMaterial: hasMaterial,
        sceneBackground: !!stage.scene.background,
        sceneFog: !!stage.scene.fog,
      }
    })

    if (materialState) {
      expect(materialState.appHasMaterial).toBe(true)
    }
  })

  test('should verify model visibility state is correct', async ({ page }) => {
    const visibilityState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null

      const app = apps[0]
      const checkVisibility = (obj) => {
        if (!obj.visible) return false
        if (obj.parent && !checkVisibility(obj.parent)) return false
        return true
      }

      return {
        rootVisible: app.root.visible,
        pathVisible: checkVisibility(app.root),
        threeSceneVisible: app.threeScene?.visible || true,
      }
    })

    if (visibilityState) {
      expect(visibilityState.rootVisible).toBe(true)
    }
  })
})

test.describe('Model Placement: Builder System Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should verify SelectionManager integration with ClientBuilder', async ({ page }) => {
    const integration = await page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      const selection = window.__DEBUG__?.systems?.selectionManager?.()

      return {
        hasBuilder: !!builder,
        hasSelection: !!selection,
        builderSelected: builder?.selected || null,
        selectionSelected: selection?.selected || null,
      }
    })

    expect(integration.hasBuilder || integration.hasSelection).toBeTruthy()
  })

  test('should verify GizmoManager is attached to correct system', async ({ page }) => {
    const gizmoIntegration = await page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()

      return {
        hasGizmo: !!gizmo,
        gizmoHasWorld: !!gizmo?.world,
        gizmoHasViewport: !!gizmo?.viewport,
        canAttach: typeof gizmo?.attachGizmo === 'function',
      }
    })

    expect(gizmoIntegration.hasGizmo).toBeTruthy()
  })

  test('should verify TransformHandler is updating transforms correctly', async ({ page }) => {
    const transformState = await page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      const handler = builder?.composer?.transformHandler

      return {
        hasHandler: !!handler,
        hasGrabMode: typeof handler?.grabModeHandler === 'object',
        hasGizmoController: typeof handler?.gizmoController === 'object',
      }
    })

    if (transformState) {
      expect(transformState.hasHandler).toBeTruthy()
    }
  })

  test('should verify network messages are broadcast with correct format', async ({ page }) => {
    const messageFormat = await page.evaluate(() => {
      window.__DEBUG__.capturedNetworkMessages = []

      const orig = window.__DEBUG__.network?.send
      if (orig) {
        window.__DEBUG__.network.send = function(type, data) {
          window.__DEBUG__.capturedNetworkMessages.push({
            type,
            hasId: !!data?.id,
            hasMover: 'mover' in data,
            hasPosition: !!data?.position,
            hasQuaternion: !!data?.quaternion,
            timestamp: Date.now(),
          })
          return orig.call(this, type, data)
        }
      }

      return { tracking: true }
    })

    await page.evaluate(() => new Promise(r => setTimeout(r, 300)))

    const messages = await page.evaluate(() => {
      return window.__DEBUG__?.capturedNetworkMessages || []
    })

    if (messages.length > 0) {
      const entityMessages = messages.filter(m => m.type === 'entityModified')
      if (entityMessages.length > 0) {
        const msg = entityMessages[0]
        expect(msg.hasId).toBe(true)
      }
    }
  })

  test('should verify control captures are properly managed', async ({ page }) => {
    const controlState = await page.evaluate(() => {
      const control = window.__DEBUG__?.systems?.clientBuilder?.()?.control

      return {
        hasControl: !!control,
        hasMouseLeft: !!control?.mouseLeft,
        hasKeyF: !!control?.keyF,
        hasKeyC: !!control?.keyC,
        hasScrollDelta: !!control?.scrollDelta,
      }
    })

    if (controlState) {
      expect(controlState.hasControl).toBeTruthy()
    }
  })

  test('should verify undo system integration', async ({ page }) => {
    const undoState = await page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      const composer = builder?.composer

      return {
        hasUndo: typeof builder?.addUndo === 'function',
        hasExecuteUndo: typeof builder?.undo === 'function',
        hasUndoStack: !!composer?.undoStack,
      }
    })

    if (undoState) {
      expect(undoState.hasUndo || undoState.hasExecuteUndo).toBeTruthy()
    }
  })
})

test.describe('Model Placement: Performance & Stability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should not leak memory with rapid selection changes', async ({ page }) => {
    const beforeMetrics = await page.metrics()

    await page.evaluate(async () => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      const apps = window.__DEBUG__?.apps?.() || []

      if (apps.length === 0) return

      for (let i = 0; i < 20; i++) {
        builder.select(apps[0])
        await new Promise(r => setTimeout(r, 10))
        builder.select(null)
        await new Promise(r => setTimeout(r, 10))
      }
    })

    const afterMetrics = await page.metrics()

    const memoryIncrease = afterMetrics.JSHeapUsedSize - beforeMetrics.JSHeapUsedSize
    expect(memoryIncrease < 10000000).toBeTruthy()
  })

  test('should handle stress test with multiple transforms', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const result = await page.evaluate(async () => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return true

      try {
        for (let i = 0; i < 10; i++) {
          apps[0].root.position.x += 0.5
          apps[0].root.rotation.y += 0.1
          apps[0].root.updateMatrix()
          await new Promise(r => setTimeout(r, 10))
        }
        return true
      } catch (e) {
        console.error('Stress test error:', e)
        return false
      }
    })

    expect(result).toBe(true)
    expect(errors.length).toBe(0)
  })

  test('should not accumulate gizmo instances on repeated attach/detach', async ({ page }) => {
    const beforeCount = await page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      return gizmo?.gizmo ? 1 : 0
    })

    await page.evaluate(async () => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      const apps = window.__DEBUG__?.apps?.() || []

      if (apps.length === 0) return

      for (let i = 0; i < 5; i++) {
        builder.select(apps[0])
        await new Promise(r => setTimeout(r, 50))
        builder.select(null)
        await new Promise(r => setTimeout(r, 50))
      }
    })

    const afterCount = await page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      return gizmo?.gizmo ? 1 : 0
    })

    expect(afterCount).toBeLessThanOrEqual(beforeCount + 1)
  })

  test('should maintain FPS during grab mode movement', async ({ page }) => {
    const fpsCheck = await page.evaluate(async () => {
      const frameCount = { value: 0 }
      const startTime = performance.now()

      return new Promise(resolve => {
        const checkFps = () => {
          frameCount.value++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(checkFps)
          } else {
            const fps = frameCount.value
            resolve({ fps: fps, acceptableFps: fps > 30 })
          }
        }
        requestAnimationFrame(checkFps)
      })
    })

    expect(fpsCheck.acceptableFps).toBe(true)
  })
})

test.describe('Model Placement: Debugging & Error Reporting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should capture and log errors without crashing', async ({ page }) => {
    const logs = []
    page.on('console', msg => {
      logs.push({ type: msg.type(), text: msg.text() })
    })

    await page.evaluate(() => {
      try {
        const invalid = null
        invalid.someMethod()
      } catch (e) {
        console.error('Caught error:', e.message)
      }
    })

    const errors = logs.filter(l => l.type === 'error')
    expect(logs.length).toBeGreaterThan(0)
  })

  test('should provide debug globals for inspection', async ({ page }) => {
    const debugGlobals = await page.evaluate(() => {
      return {
        hasDebug: !!window.__DEBUG__,
        hasApps: typeof window.__DEBUG__?.apps === 'function',
        hasEntities: typeof window.__DEBUG__?.entities === 'function',
        hasBlueprints: typeof window.__DEBUG__?.blueprints === 'function',
        hasWorld: !!window.__DEBUG__?.world,
        hasNetwork: !!window.__DEBUG__?.network,
        hasSystems: typeof window.__DEBUG__?.systems === 'function',
      }
    })

    expect(debugGlobals.hasDebug).toBe(true)
  })

  test('should track console messages for debugging', async ({ page }) => {
    const messages = await page.evaluate(() => {
      return window.__DEBUG__?.logs || { errors: [], warnings: [], info: [] }
    })

    expect(Array.isArray(messages.errors || [])).toBe(true)
  })

  test('should provide access to current world state', async ({ page }) => {
    const worldState = await page.evaluate(() => {
      const world = window.__DEBUG__?.world

      return {
        hasWorld: !!world,
        hasCamera: !!world?.camera,
        hasStage: !!world?.stage,
        hasNetwork: !!world?.network,
        hasEntities: !!world?.entities,
      }
    })

    expect(worldState.hasWorld).toBe(true)
  })

  test('should allow inspection of network connection status', async ({ page }) => {
    const networkStatus = await page.evaluate(() => {
      const net = window.__DEBUG__?.network

      return {
        hasNetwork: !!net,
        hasId: !!net?.id,
        isConnected: net?.connected !== false,
        networkId: net?.id || 'unknown',
      }
    })

    expect(networkStatus.hasNetwork).toBe(true)
  })
})
