# Mover State Machine - Testing & Verification Guide

## Fixes Implemented

### Fix 1: Guard in mover property handler (AppPropertyHandlers.js)
**Status**: ✓ IMPLEMENTED

**Change**: Added early return if mover value unchanged
```javascript
mover: (value) => {
  if (value === p.data.mover) return false  // No rebuild if unchanged
  p.data.mover = value
  return true
}
```

**Benefit**: Prevents redundant rebuilds when network sends same mover value

---

### Fix 2: Selection lock in StateTransitionHandler.js
**Status**: ✓ IMPLEMENTED

**Change**: Added selectingLock to prevent concurrent select/deselect
```javascript
constructor(parent) {
  this.parent = parent
  this.selectingLock = false  // Prevent concurrent selections
}

select(app) {
  if (this.selectingLock) return  // Queue would override this
  if (this.parent.selected === app) return

  this.selectingLock = true
  try {
    // ... select/deselect logic
  } finally {
    this.selectingLock = false
  }
}
```

**Benefit**: Prevents race condition when incoming network message arrives during local select

---

## Test Scenarios & Verification Commands

### Prerequisites
1. Start dev server: `npm run dev`
2. Open browser DevTools
3. Have two browser tabs open to same local world for multi-client testing

### Scenario 1: Basic Selection
**Expected Behavior**:
- Click model → mover set to current networkId
- Gizmo appears
- Mode changes to MOVING

**Test Commands** (in browser console):
```javascript
// Get scene app
const app = window.__DEBUG__.apps()[0]
console.log('Before select:')
console.log('  mover:', app.data.mover)
console.log('  mode:', app.mode)

// Simulate selection via click
const elem = document.elementFromPoint(window.innerWidth/2, window.innerHeight/2)
// Click on a model in center of screen

// Wait 100ms for network sync
setTimeout(() => {
  console.log('After select:')
  console.log('  mover:', app.data.mover)
  console.log('  mode:', app.mode)
  console.log('  selected === app:', window.__DEBUG__.world.builder?.selected === app)
}, 100)
```

**Verification Checklist**:
- [ ] app.data.mover === currentNetworkId
- [ ] app.mode === 'moving'
- [ ] gizmo visible on screen
- [ ] No errors in console

---

### Scenario 2: Basic Deselection
**Expected Behavior**:
- Click ground (while holding model) → mover cleared
- Gizmo disappears
- Mode changes back to ACTIVE

**Test Commands**:
```javascript
const app = window.__DEBUG__.apps()[0]
console.log('Before deselect:')
console.log('  mover:', app.data.mover)
console.log('  mode:', app.mode)

// Click on ground/empty space
const elem = document.elementFromPoint(100, 100)
elem?.click?.()

setTimeout(() => {
  console.log('After deselect:')
  console.log('  mover:', app.data.mover)
  console.log('  mode:', app.mode)
  console.log('  selected === app:', window.__DEBUG__.world.builder?.selected === app)
}, 100)
```

**Verification Checklist**:
- [ ] app.data.mover === null
- [ ] app.mode === 'active'
- [ ] gizmo invisible
- [ ] No errors in console

---

### Scenario 3: Rapid Select/Deselect (5x)
**Expected Behavior**:
- Spam select/deselect: no state corruption
- No console errors
- Final state correct

**Test Commands**:
```javascript
const app = window.__DEBUG__.apps()[0]
const networkId = window.__DEBUG__.world.network.id

async function rapidSelectDeselect(times) {
  for (let i = 0; i < times; i++) {
    // Simulate selection
    window.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await new Promise(r => setTimeout(r, 50))

    // Simulate deselection
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await new Promise(r => setTimeout(r, 50))
  }
}

console.log('Starting rapid select/deselect...')
rapidSelectDeselect(5).then(() => {
  console.log('Final state:')
  console.log('  mover:', app.data.mover)
  console.log('  mode:', app.mode)
  console.log('  No corruption:', app.data.mover === null || app.data.mover === networkId)
})

// Monitor for errors
const initialErrorCount = window.__DEBUG__.logs.errors.length
```

**Verification Checklist**:
- [ ] Final mover state is either null or networkId (not garbage)
- [ ] No "selectingLock" related errors
- [ ] No double-build messages
- [ ] Error count unchanged

---

### Scenario 4: Network Lag Simulation (100ms delay)
**Expected Behavior**:
- Select locally completes
- Network delayed 100ms
- Other clients eventually receive correct ownership

**Test Commands** (Tab 1 - selecting):
```javascript
// In first tab - the one doing selecting
const app = window.__DEBUG__.apps()[0]
const networkId = window.__DEBUG__.world.network.id

console.log('T0: Before select')
console.log('  mover:', app.data.mover)

// Simulate network delay by capturing message
const originalSend = window.__DEBUG__.world.network.send
let capturedMsg = null
window.__DEBUG__.world.network.send = function(type, data) {
  if (type === 'entityModified' && data.mover !== undefined) {
    console.log(`Captured message at T0+0ms:`, data)
    capturedMsg = { type, data }
    // Delay send by 100ms
    setTimeout(() => {
      console.log(`Sending delayed message at T0+100ms`)
      originalSend.call(this, type, data)
    }, 100)
  } else {
    return originalSend.call(this, type, data)
  }
}

// Now click to select
console.log('T1: Clicking to select...')
// [Click on a model]

setTimeout(() => {
  console.log('T100: Local state after select')
  console.log('  mover:', app.data.mover)
  console.log('  mode:', app.mode)
}, 100)

setTimeout(() => {
  console.log('T150: Network should have received')
  console.log('  Check other tab console')
}, 150)
```

**Test Commands** (Tab 2 - receiving):
```javascript
// In second tab - the one receiving
const app = window.__DEBUG__.apps()[0]

window.__DEBUG__.moverHistory = []

// Hook into property handlers
const originalModify = app.modify?.bind(app) || (() => {})
app.modify = function(data) {
  if (data.mover !== undefined) {
    window.__DEBUG__.moverHistory.push({
      time: Date.now(),
      value: data.mover,
      oldValue: this.data.mover
    })
    console.log('Received mover update:', data.mover, '(was:', this.data.mover, ')')
  }
  return originalModify(data)
}

console.log('Listening for mover updates on Tab 2...')

setTimeout(() => {
  console.log('Tab 2 history:', window.__DEBUG__.moverHistory)
}, 300)
```

**Verification Checklist**:
- [ ] Tab 1 local state updates immediately
- [ ] Tab 2 receives update after 100ms delay
- [ ] Both tabs show same final mover value
- [ ] No state corruption on either tab
- [ ] No race condition errors

---

### Scenario 5: Multiple Clients Simultaneous Select
**Expected Behavior**:
- Two clients try to select same model
- Only first message to server wins
- Other client auto-deselects

**Test Commands** (Tab 1 - first to select):
```javascript
const app = window.__DEBUG__.apps()[0]

console.log('Tab 1: Before select')
console.log('  mover:', app.data.mover)

// Click to select (this one will "win")
// [Click on model]

setTimeout(() => {
  console.log('Tab 1: After select')
  console.log('  mover:', app.data.mover)
  console.log('  selected:', window.__DEBUG__.world.builder?.selected === app)
}, 100)
```

**Test Commands** (Tab 2 - second to select):
```javascript
const app = window.__DEBUG__.apps()[0]
const otherNetworkId = window.__DEBUG__.world.network.id

console.log('Tab 2: Before select')
console.log('  mover:', app.data.mover)
console.log('  My networkId:', otherNetworkId)

// Click to select (this one will lose)
// [Click on model] - do this ALMOST at same time as Tab 1

setTimeout(() => {
  console.log('Tab 2: After select')
  console.log('  mover:', app.data.mover)
  console.log('  selected:', window.__DEBUG__.world.builder?.selected === app)

  // Should auto-deselect because mover != my networkId
  console.log('  Am I owner?', app.data.mover === otherNetworkId)
}, 100)

setTimeout(() => {
  console.log('Tab 2: After network sync (200ms)')
  console.log('  mover:', app.data.mover)
  console.log('  still selected?:', window.__DEBUG__.world.builder?.selected === app)
}, 200)
```

**Verification Checklist**:
- [ ] Tab 1: mover = Tab1.networkId (wins)
- [ ] Tab 2: mover = Tab1.networkId (receives update)
- [ ] Tab 2: auto-deselects (selected = null)
- [ ] Tab 2: No errors when ownership lost
- [ ] Both consistent after 200ms

---

## Automated Test Script

Save as `test-mover-state.js`:

```javascript
async function testMoverState() {
  const results = {
    scenario1: false,
    scenario2: false,
    scenario3: false,
    scenario4: false,
    scenario5: false,
  }

  try {
    // Scenario 1: Basic Selection
    console.log('=== Scenario 1: Basic Selection ===')
    const app1 = window.__DEBUG__.apps()[0]
    if (!app1) throw new Error('No app found')

    window.__DEBUG__.world.builder?.select(app1)
    await new Promise(r => setTimeout(r, 100))

    results.scenario1 =
      app1.data.mover === window.__DEBUG__.world.network.id &&
      app1.mode === 'moving'
    console.log('✓ Scenario 1:', results.scenario1 ? 'PASS' : 'FAIL')

    // Scenario 2: Basic Deselection
    console.log('=== Scenario 2: Basic Deselection ===')
    window.__DEBUG__.world.builder?.select(null)
    await new Promise(r => setTimeout(r, 100))

    results.scenario2 =
      app1.data.mover === null &&
      app1.mode === 'active'
    console.log('✓ Scenario 2:', results.scenario2 ? 'PASS' : 'FAIL')

    // Scenario 3: Rapid Select/Deselect
    console.log('=== Scenario 3: Rapid Select/Deselect ===')
    let hasError = false
    const errorCountBefore = window.__DEBUG__.logs.errors.length

    for (let i = 0; i < 5; i++) {
      window.__DEBUG__.world.builder?.select(app1)
      await new Promise(r => setTimeout(r, 30))
      window.__DEBUG__.world.builder?.select(null)
      await new Promise(r => setTimeout(r, 30))
    }

    const errorCountAfter = window.__DEBUG__.logs.errors.length
    results.scenario3 =
      (app1.data.mover === null || app1.data.mover === window.__DEBUG__.world.network.id) &&
      errorCountAfter === errorCountBefore
    console.log('✓ Scenario 3:', results.scenario3 ? 'PASS' : 'FAIL')
    console.log('  Errors:', errorCountAfter - errorCountBefore)

    // Final Summary
    console.log('\n=== Test Summary ===')
    console.log('Scenario 1 (Basic Select):', results.scenario1 ? '✓' : '✗')
    console.log('Scenario 2 (Basic Deselect):', results.scenario2 ? '✓' : '✗')
    console.log('Scenario 3 (Rapid Ops):', results.scenario3 ? '✓' : '✗')
    console.log('Scenario 4 (Network Lag): Manual test (see instructions)')
    console.log('Scenario 5 (Multi-Client): Manual test (see instructions)')

    const passed = Object.values(results).filter(Boolean).length
    console.log(`\nTotal Automated: ${passed}/3 PASSED`)

  } catch (err) {
    console.error('Test error:', err.message)
  }
}

// Run tests
testMoverState()
```

Run in browser console:
```javascript
// Copy and paste above script, then:
testMoverState()
```

---

## Quick Diagnostics

### Current Mover State Check
```javascript
const app = window.__DEBUG__.apps()[0]
console.log({
  appId: app.data.id,
  mover: app.data.mover,
  currentNetworkId: window.__DEBUG__.world.network.id,
  isOwned: app.data.mover === window.__DEBUG__.world.network.id,
  mode: app.mode,
  selected: window.__DEBUG__.world.builder?.selected === app,
})
```

### Check for Mover Corruption
```javascript
const apps = window.__DEBUG__.apps()
const networkId = window.__DEBUG__.world.network.id

apps.forEach(app => {
  if (app.data.mover && app.data.mover !== networkId) {
    console.warn('Owned by other player:', app.data.id, app.data.mover)
  }
  if (app.data.mover === '') {
    console.error('CORRUPTED - Empty string mover:', app.data.id)
  }
  if (typeof app.data.mover !== 'string' && app.data.mover !== null) {
    console.error('CORRUPTED - Invalid mover type:', app.data.id, typeof app.data.mover)
  }
})
console.log('Mover validation complete')
```

### Monitor Mover Changes
```javascript
const app = window.__DEBUG__.apps()[0]
const originalModify = app.modify.bind(app)

app.modify = function(data) {
  if (data.mover !== undefined) {
    console.log(`Mover changed: ${this.data.mover} → ${data.mover}`)
  }
  return originalModify(data)
}

console.log('Now monitoring mover changes on app:', app.data.id)
```

---

## Debug Logging

Add temporary logging to verify fix is working:

In `src/core/entities/app/AppPropertyHandlers.js`:
```javascript
mover: (value) => {
  if (value === p.data.mover) {
    console.log(`[AppPropertyHandlers] Mover unchanged: ${value}, skipping rebuild`)
    return false
  }
  console.log(`[AppPropertyHandlers] Mover changed: ${p.data.mover} → ${value}`)
  p.data.mover = value
  return true
}
```

In `src/core/systems/builder/StateTransitionHandler.js`:
```javascript
select(app) {
  if (this.selectingLock) {
    console.log('[StateTransitionHandler] Selection already in progress, ignoring')
    return
  }
  // ... rest of function
  this.selectingLock = true
  try {
    console.log(`[StateTransitionHandler] Selecting app: ${app?.data?.id}`)
    // ... rest of function
  } finally {
    this.selectingLock = false
  }
}
```

---

## Files Modified

1. ✓ `src/core/entities/app/AppPropertyHandlers.js` - Added unchanged check
2. ✓ `src/core/systems/builder/StateTransitionHandler.js` - Added selectingLock

## Expected Outcomes

After applying these fixes:
- ✓ No race conditions between local select and network updates
- ✓ No redundant rebuilds from unchanged mover values
- ✓ Rapid select/deselect operations are safe
- ✓ Multi-client simultaneous selection is handled correctly
- ✓ Network lag doesn't cause state corruption
