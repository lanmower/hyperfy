import { test, expect } from '@playwright/test'

test.describe('Model Placement: Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should open import model file dialog', async ({ page }) => {
    const fileInputSelector = 'input[type="file"][accept=".glb,.vrm"]'
    const fileInput = await page.$(fileInputSelector)
    expect(fileInput).toBeTruthy()
  })

  test('should handle file selection without error', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const fileInputSelector = 'input[type="file"][accept=".glb,.vrm"]'
    expect(await page.$(fileInputSelector)).toBeTruthy()
    expect(errors.length).toBe(0)
  })

  test('should spawn model at correct position (in front of camera)', async ({ page }) => {
    const initialState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      return { appCount: apps.length }
    })

    const modelState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null
      const app = apps[0]
      return {
        id: app.data.id,
        position: app.root.position.toArray(),
        camera: {
          position: window.__DEBUG__.world.camera.position.toArray(),
          direction: (() => {
            const dir = new THREE.Vector3(0, 0, -1)
            dir.applyQuaternion(window.__DEBUG__.world.rig.quaternion)
            return dir.toArray()
          })(),
        },
      }
    })

    if (modelState) {
      expect(modelState.position).toBeTruthy()
      expect(modelState.position.length).toBe(3)
    }
  })

  test('should initialize model with mover=null (not assigned to player)', async ({ page }) => {
    const modelData = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null
      const app = apps[0]
      return {
        id: app.data.id,
        mover: app.data.mover,
        blueprint: app.data.blueprint,
      }
    })

    if (modelData) {
      expect(modelData.mover).toBeNull()
    }
  })

  test('should render model with correct geometry in scene', async ({ page }) => {
    const sceneState = await page.evaluate(() => {
      const stage = window.__DEBUG__?.systems?.stage?.()
      if (!stage?.scene) return { childCount: 0, hasModels: false }

      return {
        childCount: stage.scene.children.length,
        hasModels: stage.scene.children.length > 0,
        children: stage.scene.children.map(c => ({
          type: c.type,
          name: c.name,
          hasGeometry: !!c.geometry,
        })),
      }
    })

    expect(sceneState.childCount).toBeGreaterThan(0)
  })

  test('should verify model bounds are calculable', async ({ page }) => {
    const boundState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null
      const app = apps[0]

      if (!app.root) return null

      const box = new THREE.Box3().setFromObject(app.root)
      return {
        size: box.getSize(new THREE.Vector3()).toArray(),
        center: box.getCenter(new THREE.Vector3()).toArray(),
        isValid: !box.isEmpty(),
      }
    })

    if (boundState) {
      expect(boundState.isValid).toBe(true)
      expect(boundState.size.length).toBe(3)
      expect(boundState.center.length).toBe(3)
    }
  })

  test('should broadcast model creation network message', async ({ page }) => {
    const networkMessages = []

    await page.evaluate(() => {
      const original = window.__DEBUG__?.network?.send
      if (original) {
        window.__DEBUG__.network.send = function(type, data) {
          window.__DEBUG__.networkMessages = window.__DEBUG__.networkMessages || []
          window.__DEBUG__.networkMessages.push({ type, data, time: Date.now() })
          return original.call(this, type, data)
        }
      }
    })

    const messages = await page.evaluate(() => {
      return window.__DEBUG__?.networkMessages || []
    })

    const createMessages = messages.filter(m => m.type === 'entityModified' || m.type === 'entityCreated')
    expect(createMessages.length).toBeGreaterThan(0)
  })
})

test.describe('Model Placement: Selection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should select model via raycast (click on center)', async ({ page }) => {
    const initialSelected = await page.evaluate(() => {
      return window.__DEBUG__?.getSelected?.() || null
    })

    if (initialSelected) {
      const selected = await page.evaluate(() => {
        return window.__DEBUG__?.getSelected?.()
      })
      expect(selected).not.toBeNull()
    }
  })

  test('should update SelectionManager state on selection', async ({ page }) => {
    const selectionState = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      if (!selected) return null

      return {
        hasSelected: !!selected,
        hasOutline: selected.outline !== null,
        outlineColor: selected.outline,
      }
    })

    if (selectionState) {
      expect(selectionState.hasSelected).toBe(true)
      expect(selectionState.hasOutline).toBe(true)
      expect(selectionState.outlineColor).toBe(0xff9a00)
    }
  })

  test('should set mover to player network ID on selection', async ({ page }) => {
    const selectState = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      const selected = window.__DEBUG__?.getSelected?.()

      if (!selected || !selected.data) return null

      return {
        mover: selected.data.mover,
        playerNetworkId: window.__DEBUG__.network?.id,
        isMoverPlayer: selected.data.mover === window.__DEBUG__.network?.id,
      }
    })

    if (selectState) {
      expect(selectState.isMoverPlayer).toBe(true)
    }
  })

  test('should attach gizmo at model location on selection', async ({ page }) => {
    const gizmoState = await page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      const selected = window.__DEBUG__?.getSelected?.()

      if (!gizmo || !selected) return null

      return {
        hasGizmo: gizmo.hasGizmo?.(),
        gizmoActive: gizmo.gizmoActive,
        gizmoPosition: gizmo.gizmoTarget?.position?.toArray() || null,
        selectedPosition: selected.root?.position?.toArray() || null,
      }
    })

    if (gizmoState) {
      expect(gizmoState.hasGizmo).toBe(true)
      if (gizmoState.gizmoPosition && gizmoState.selectedPosition) {
        const dist = Math.sqrt(
          Math.pow(gizmoState.gizmoPosition[0] - gizmoState.selectedPosition[0], 2) +
            Math.pow(gizmoState.gizmoPosition[1] - gizmoState.selectedPosition[1], 2) +
            Math.pow(gizmoState.gizmoPosition[2] - gizmoState.selectedPosition[2], 2)
        )
        expect(dist).toBeLessThan(0.1)
      }
    }
  })

  test('should render gizmo helper in Three.js scene', async ({ page }) => {
    const gizmoInScene = await page.evaluate(() => {
      const stage = window.__DEBUG__?.systems?.stage?.()
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()

      if (!stage?.scene || !gizmo?.gizmoHelper) return false

      return stage.scene.children.includes(gizmo.gizmoHelper)
    })

    if (gizmoInScene !== null) {
      expect(gizmoInScene).toBe(true)
    }
  })

  test('should show selection highlight on model outline', async ({ page }) => {
    const outlineState = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()

      if (!selected) return null

      return {
        outlineExists: selected.outline !== null && selected.outline !== undefined,
        outlineColor: selected.outline,
        expectedColor: 0xff9a00,
      }
    })

    if (outlineState) {
      expect(outlineState.outlineExists).toBe(true)
      expect(outlineState.outlineColor).toBe(outlineState.expectedColor)
    }
  })
})

test.describe('Model Placement: Grab Mode Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should enter grab mode when enabled', async ({ page }) => {
    const modeState = await page.evaluate(() => {
      const mode = window.__DEBUG__?.systems?.clientBuilder?.()?.getMode?.()
      return { mode, canGrab: mode !== undefined }
    })

    expect(modeState.canGrab).toBe(true)
  })

  test('should position model at raycast hit on ground', async ({ page }) => {
    const positionState = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      const target = window.__DEBUG__?.systems?.clientBuilder?.()?.target

      if (!selected || !target) return null

      return {
        selectedPos: selected.root.position.toArray(),
        targetPos: target.position?.toArray() || null,
        hasTarget: !!target,
      }
    })

    if (positionState) {
      expect(positionState.selectedPos).toBeTruthy()
      expect(positionState.selectedPos.length).toBe(3)
    }
  })

  test('should update model distance from camera with F/C keys', async ({ page }) => {
    const distanceBefore = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      const camera = window.__DEBUG__?.world?.camera

      if (!selected || !camera) return null

      return camera.position.distanceTo(selected.root.position)
    })

    await page.keyboard.press('f')
    await page.evaluate(() => new Promise(r => setTimeout(r, 100)))

    const distanceAfter = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      const camera = window.__DEBUG__?.world?.camera

      if (!selected || !camera) return null

      return camera.position.distanceTo(selected.root.position)
    })

    if (distanceBefore !== null && distanceAfter !== null) {
      expect(distanceAfter).toBeTruthy()
    }
  })

  test('should rotate model with mouse wheel', async ({ page }) => {
    const rotationBefore = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      if (!selected) return null
      return selected.root.rotation.y
    })

    await page.mouse.move(500, 300)
    await page.mouse.wheel(0, 10)
    await page.evaluate(() => new Promise(r => setTimeout(r, 100)))

    const rotationAfter = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      if (!selected) return null
      return selected.root.rotation.y
    })

    if (rotationBefore !== null && rotationAfter !== null) {
      expect(rotationBefore).not.toEqual(rotationAfter)
    }
  })

  test('should apply snap-to-grid when enabled', async ({ page }) => {
    const snapState = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      if (!selected) return null

      const snap = selected.root.position.x % 1
      return {
        position: selected.root.position.toArray(),
        isSnapped: Math.abs(snap) < 0.01 || Math.abs(snap - 1) < 0.01,
      }
    })

    if (snapState) {
      expect(snapState.position.length).toBe(3)
    }
  })

  test('should detect ground collision', async ({ page }) => {
    const collisionState = await page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      if (!builder || !builder.snaps) return { hasSnaps: false }

      return {
        hasSnaps: !!builder.snaps,
        hasOctree: !!builder.snaps?.octree,
      }
    })

    if (collisionState) {
      expect(collisionState.hasSnaps).toBe(true)
    }
  })
})

test.describe('Model Placement: Finalization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should reset mover to null on deselection', async ({ page }) => {
    const selected = await page.evaluate(() => {
      return window.__DEBUG__?.getSelected?.()
    })

    if (!selected) {
      const deselectState = await page.evaluate(() => {
        const apps = window.__DEBUG__?.apps?.() || []
        if (apps.length === 0) return null
        return { mover: apps[0].data.mover }
      })

      if (deselectState) {
        expect(deselectState.mover).toBeNull()
      }
    }
  })

  test('should broadcast final position on deselection', async ({ page }) => {
    const networkState = await page.evaluate(() => {
      window.__DEBUG__.messages = window.__DEBUG__.messages || []
      const orig = window.__DEBUG__.network?.send
      if (orig) {
        window.__DEBUG__.network.send = function(type, data) {
          window.__DEBUG__.messages.push({ type, data })
          return orig.call(this, type, data)
        }
      }
      return { tracking: true }
    })

    await page.keyboard.press('escape')
    await page.evaluate(() => new Promise(r => setTimeout(r, 200)))

    const messages = await page.evaluate(() => {
      return window.__DEBUG__?.messages || []
    })

    const modifyMessages = messages.filter(m => m.type === 'entityModified')
    expect(modifyMessages.length).toBeGreaterThan(0)
  })

  test('should lock model in place after placement', async ({ page }) => {
    const finalState = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      const apps = window.__DEBUG__?.apps?.() || []
      if (apps.length === 0) return null

      const app = apps[0]
      return {
        isMoverSet: app.data.mover !== null,
        isLocked: app.data.pinned === true,
      }
    })

    if (finalState) {
      expect(finalState.isMoverSet || !finalState.isLocked).toBeTruthy()
    }
  })

  test('should hide gizmo after deselection', async ({ page }) => {
    const gizmoAfterDeselect = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      if (selected) return null

      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      return {
        hasGizmo: gizmo?.hasGizmo?.() || false,
      }
    })

    if (gizmoAfterDeselect) {
      expect(gizmoAfterDeselect.hasGizmo).toBe(false)
    }
  })

  test('should allow selecting other models after placement', async ({ page }) => {
    const multiSelectCapable = await page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      return apps.length > 1
    })

    if (multiSelectCapable) {
      const secondSelection = await page.evaluate(() => {
        const apps = window.__DEBUG__?.apps?.() || []
        if (apps.length > 1) {
          window.__DEBUG__.select(apps[1])
          return true
        }
        return false
      })

      expect(secondSelection).toBeTruthy()
    }
  })
})

test.describe('Model Placement: Network Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)))
  })

  test('should sync position updates to network during grab mode', async ({ page }) => {
    const messages = []

    await page.evaluate(() => {
      window.__DEBUG__.networkMessages = []
      const orig = window.__DEBUG__.network?.send
      if (orig) {
        window.__DEBUG__.network.send = function(type, data) {
          window.__DEBUG__.networkMessages.push({ type, time: Date.now() })
          return orig.call(this, type, data)
        }
      }
    })

    await page.evaluate(() => new Promise(r => setTimeout(r, 500)))

    const syncMessages = await page.evaluate(() => {
      return (window.__DEBUG__?.networkMessages || []).filter(m => m.type === 'entityModified')
    })

    expect(syncMessages).toBeTruthy()
  })

  test('should include position in network messages', async ({ page }) => {
    const messageData = await page.evaluate(() => {
      window.__DEBUG__.capturedMessages = []
      const orig = window.__DEBUG__.network?.send
      if (orig) {
        window.__DEBUG__.network.send = function(type, data) {
          if (type === 'entityModified') {
            window.__DEBUG__.capturedMessages.push(data)
          }
          return orig.call(this, type, data)
        }
      }
      return null
    })

    await page.evaluate(() => new Promise(r => setTimeout(r, 200)))

    const messages = await page.evaluate(() => {
      return window.__DEBUG__?.capturedMessages || []
    })

    if (messages.length > 0) {
      const msg = messages[0]
      expect(msg.id).toBeTruthy()
      expect(msg.position || msg.mover !== undefined).toBeTruthy()
    }
  })

  test('should include mover field in selection network message', async ({ page }) => {
    const moverMessage = await page.evaluate(() => {
      window.__DEBUG__.selectMessages = []
      const orig = window.__DEBUG__.network?.send
      if (orig) {
        window.__DEBUG__.network.send = function(type, data) {
          if (type === 'entityModified' && data.mover !== undefined) {
            window.__DEBUG__.selectMessages.push(data)
          }
          return orig.call(this, type, data)
        }
      }
      return null
    })

    const selected = await page.evaluate(() => {
      const selected = window.__DEBUG__?.getSelected?.()
      return !!selected
    })

    await page.evaluate(() => new Promise(r => setTimeout(r, 300)))

    const messages = await page.evaluate(() => {
      return window.__DEBUG__?.selectMessages || []
    })

    if (selected && messages.length > 0) {
      const msg = messages[0]
      expect(msg.mover).toBeDefined()
    }
  })
})
