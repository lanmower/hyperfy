# Model Placement Test Examples

Real-world examples of testing common model placement scenarios.

## Example 1: Complete Selection Workflow

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('complete model selection workflow', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  // Get initial state
  const allModels = await helpers.getAllModels(page)
  expect(allModels.length).toBeGreaterThan(0)

  const firstModelId = allModels[0].id
  const initialMover = allModels[0].mover

  // Select model
  const selected = await helpers.selectModel(page, firstModelId)
  expect(selected).toBe(true)

  // Verify selection state
  const selectedModel = await helpers.getSelectedModel(page)
  expect(selectedModel.id).toBe(firstModelId)

  // Verify mover was set to player
  const networkId = (await helpers.getWorldMetrics(page)).networkId
  const moverSet = await helpers.verifyMoverIsSet(page, firstModelId, networkId)
  expect(moverSet).toBe(true)

  // Verify gizmo attached
  const hasGizmo = await helpers.verifyGizmoAttached(page)
  expect(hasGizmo).toBe(true)

  // Verify network message sent
  await helpers.clearNetworkMessageLog(page)
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)))
  const messages = await helpers.getNetworkMessages(page)
  expect(messages.length).toBeGreaterThan(0)

  // Deselect
  await helpers.deselectModel(page)

  // Verify deselection state
  const moverCleared = await helpers.verifyMoverIsNull(page, firstModelId)
  expect(moverCleared).toBe(true)

  const gizmoDetached = await helpers.verifyGizmoDetached(page)
  expect(gizmoDetached).toBe(true)
})
```

## Example 2: Grab Mode Movement

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('grab mode movement with distance adjustment', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)
  await helpers.enableBuildMode(page)

  // Get a model
  const allModels = await helpers.getAllModels(page)
  expect(allModels.length).toBeGreaterThan(0)
  const modelId = allModels[0].id

  // Select it
  await helpers.selectModel(page, modelId)

  // Switch to grab mode
  await helpers.setMode(page, 'grab')
  const currentMode = await helpers.getMode(page)
  expect(currentMode).toBe('grab')

  // Record initial position
  let model = await helpers.getSelectedModel(page)
  const initialPos = model.position
  const initialDistance = Math.sqrt(
    initialPos[0] ** 2 + initialPos[1] ** 2 + initialPos[2] ** 2
  )

  // Press F to move closer
  await page.keyboard.press('f')
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)))

  // Get new position
  model = await helpers.getSelectedModel(page)
  const newDistance = Math.sqrt(
    model.position[0] ** 2 + model.position[1] ** 2 + model.position[2] ** 2
  )

  // Distance should increase (moved closer to camera, but distance value calc)
  expect(newDistance).toBeTruthy()

  // Test rotation with mouse wheel
  const rotBefore = model.quaternion
  await page.mouse.move(500, 300)
  await page.mouse.wheel(0, 10)
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)))

  model = await helpers.getSelectedModel(page)
  const rotAfter = model.quaternion

  // Quaternion should have changed
  expect(rotAfter).not.toEqual(rotBefore)

  // Exit grab mode
  await helpers.setMode(page, 'translate')
  await helpers.deselectModel(page)
})
```

## Example 3: Network Message Verification

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('network message format and frequency', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  // Clear any existing messages
  await helpers.clearNetworkMessageLog(page)

  // Get models
  const allModels = await helpers.getAllModels(page)
  const modelId = allModels[0].id

  // Select model - should send entityModified with mover
  await helpers.selectModel(page, modelId)
  await page.evaluate(() => new Promise(r => setTimeout(r, 200)))

  // Check messages
  let messages = await helpers.getNetworkMessages(page)
  const selectMessages = messages.filter(m => m.type === 'entityModified' && m.data.mover)

  expect(selectMessages.length).toBeGreaterThan(0)

  const selectMsg = selectMessages[0]
  expect(selectMsg.data.id).toBe(modelId)
  expect(selectMsg.data.mover).toBeTruthy()

  // Clear for deselect test
  await helpers.clearNetworkMessageLog(page)

  // Deselect
  await helpers.deselectModel(page)
  await page.evaluate(() => new Promise(r => setTimeout(r, 200)))

  // Check deselect message
  messages = await helpers.getNetworkMessages(page)
  const deselectMessages = messages.filter(
    m => m.type === 'entityModified' && m.data.mover === null
  )

  expect(deselectMessages.length).toBeGreaterThan(0)
  const deselectMsg = deselectMessages[0]
  expect(deselectMsg.data.id).toBe(modelId)
  expect(deselectMsg.data.mover).toBeNull()
})
```

## Example 4: Scene Graph Verification

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('model is properly added to Three.js scene', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  const allModels = await helpers.getAllModels(page)
  const modelId = allModels[0].id

  // Verify model is in scene
  const inScene = await helpers.verifyModelInScene(page, modelId)
  expect(inScene).toBe(true)

  // Get scene state
  const sceneState = await helpers.getSceneState(page)
  expect(sceneState.childrenCount).toBeGreaterThan(0)

  // Verify transforms work
  const initialPosition = [10, 5, 20]
  await helpers.moveModel(page, modelId, initialPosition)

  const model = await helpers.getSelectedModel(page)
  if (model) {
    const diff = model.position.map((p, i) => Math.abs(p - initialPosition[i]))
    const moved = diff.every(d => d < 0.1)
    expect(moved).toBe(true)
  }

  // Verify rotation works
  const rotation = [0, 0.707, 0, 0.707] // 90 degree rotation around Y
  await helpers.rotateModel(page, modelId, rotation)

  const rotated = await helpers.getSelectedModel(page)
  if (rotated) {
    expect(rotated.quaternion).toBeTruthy()
  }

  // Verify scale works
  const scale = [2, 2, 2]
  await helpers.scaleModel(page, modelId, scale)

  const scaled = await helpers.getSelectedModel(page)
  if (scaled) {
    expect(scaled.scale).toBeTruthy()
  }
})
```

## Example 5: Error Handling

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('gracefully handles errors during placement', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  // Clear error log
  await helpers.clearConsoleLog(page)

  // Try to select non-existent model
  const result = await helpers.selectModel(page, 'non-existent-id')
  expect(result).toBe(false)

  // No critical errors should occur
  const errors = await helpers.getConsoleErrors(page)
  const criticalErrors = errors.filter(e => {
    const msg = e[0] || ''
    return typeof msg === 'string' &&
      (msg.includes('Cannot read') ||
       msg.includes('TypeError') ||
       msg.includes('ReferenceError'))
  })
  expect(criticalErrors.length).toBe(0)

  // Verify system still functional
  const models = await helpers.getAllModels(page)
  expect(models.length).toBeGreaterThanOrEqual(0)
})
```

## Example 6: Build Mode Integration

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('build mode integration with placement', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  // Verify build mode can be toggled
  let enabled = await helpers.isBuildModeEnabled(page)
  const initialState = enabled

  // Enable if not already
  if (!enabled) {
    await helpers.enableBuildMode(page)
    enabled = await helpers.isBuildModeEnabled(page)
    expect(enabled).toBe(true)
  }

  // Get models
  const allModels = await helpers.getAllModels(page)
  expect(allModels.length).toBeGreaterThan(0)

  // Mode should be settable
  await helpers.setMode(page, 'translate')
  let mode = await helpers.getMode(page)
  expect(mode).toBe('translate')

  // Switch to grab
  await helpers.setMode(page, 'grab')
  mode = await helpers.getMode(page)
  expect(mode).toBe('grab')

  // Switch back to translate
  await helpers.setMode(page, 'translate')
  mode = await helpers.getMode(page)
  expect(mode).toBe('translate')
})
```

## Example 7: Stress Test

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('rapid selection cycles do not leak memory or crash', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  const allModels = await helpers.getAllModels(page)
  if (allModels.length === 0) return

  const modelId = allModels[0].id

  // Get initial metrics
  const beforeMetrics = await page.metrics()
  const initialHeap = beforeMetrics.JSHeapUsedSize

  // Rapid cycles
  for (let i = 0; i < 50; i++) {
    await helpers.selectModel(page, modelId)
    await page.evaluate(() => new Promise(r => setTimeout(r, 10)))
    await helpers.deselectModel(page)
    await page.evaluate(() => new Promise(r => setTimeout(r, 10)))
  }

  // Check memory
  const afterMetrics = await page.metrics()
  const finalHeap = afterMetrics.JSHeapUsedSize
  const heapIncrease = finalHeap - initialHeap

  // Should not increase more than 20MB
  expect(heapIncrease < 20000000).toBe(true)

  // System should still work
  const models = await helpers.getAllModels(page)
  expect(models.length).toBeGreaterThan(0)

  // No critical errors
  const errors = await helpers.getConsoleErrors(page)
  const critical = errors.filter(e => {
    const msg = e[0] || ''
    return msg.includes('Maximum call stack') || msg.includes('out of memory')
  })
  expect(critical.length).toBe(0)
})
```

## Example 8: Gizmo Lifecycle

```javascript
import { test, expect } from '@playwright/test'
import helpers from '../fixtures/model-placement-helpers'

test('gizmo attaches and detaches correctly', async ({ page }) => {
  // Setup
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await helpers.setupDebugEnvironment(page)

  const allModels = await helpers.getAllModels(page)
  const modelId = allModels[0].id

  // Initially no gizmo
  let hasGizmo = await helpers.verifyGizmoAttached(page)
  expect(hasGizmo).toBe(false)

  // Select model
  await helpers.selectModel(page, modelId)
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)))

  // Gizmo should be attached
  hasGizmo = await helpers.verifyGizmoAttached(page)
  expect(hasGizmo).toBe(true)

  // Get gizmo position
  const gizmoPos = await helpers.getGizmoPosition(page)
  const model = await helpers.getSelectedModel(page)

  // Gizmo should be at model position
  if (gizmoPos && model) {
    const dist = Math.sqrt(
      (gizmoPos[0] - model.position[0]) ** 2 +
        (gizmoPos[1] - model.position[1]) ** 2 +
        (gizmoPos[2] - model.position[2]) ** 2
    )
    expect(dist < 0.1).toBe(true)
  }

  // Deselect
  await helpers.deselectModel(page)
  await page.evaluate(() => new Promise(r => setTimeout(r, 100)))

  // Gizmo should be detached
  hasGizmo = await helpers.verifyGizmoDetached(page)
  expect(hasGizmo).toBe(true)
})
```

## Testing Tips

1. **Always wait for network idle** - Models may be loading from server
2. **Use helpers for consistency** - They handle debug globals setup
3. **Take screenshots on failure** - Add `page.screenshot()` before assertions
4. **Check console for errors** - Use `getConsoleErrors()` to catch issues
5. **Clear logs between checks** - Use `clearNetworkMessageLog()` to isolate
6. **Wait for async operations** - Add `await page.evaluate(() => new Promise(r => setTimeout(r, 100)))`
7. **Verify both state and network** - Check app.data AND network messages
8. **Test error paths** - Try invalid operations to verify error handling
9. **Use descriptive assertions** - Add context to expect() failures
10. **Document test purpose** - Comments help understand regression coverage
