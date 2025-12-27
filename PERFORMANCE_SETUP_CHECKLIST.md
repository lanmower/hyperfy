# Performance Monitoring - Setup Checklist

Complete this checklist to integrate the performance monitoring system into your Hyperfy project.

## Pre-Integration Review

- [ ] Read `PERFORMANCE_BASELINE_SUMMARY.md` for overview
- [ ] Review `PERFORMANCE_INTEGRATION_GUIDE.md` for detailed steps
- [ ] Check `PERFORMANCE_QUICK_REFERENCE.md` for common operations
- [ ] Understand baseline thresholds in `performance-baseline.json`

## Phase 1: System Registration

### Step 1.1: Register in SystemRegistry
**File**: `src/core/systems/SystemRegistry.js`

```javascript
import { PerformanceMonitor } from './PerformanceMonitor.js'

// Add to clientSystems array:
{ name: 'performanceMonitor', class: PerformanceMonitor }
```

- [ ] PerformanceMonitor imported
- [ ] Added to clientSystems array
- [ ] No syntax errors (test with: `npm run build`)

## Phase 2: World Integration

### Step 2.1: Setup Instrumentation Hooks
**File**: `src/client/world-client.js`

After `world.init()` completes, add:
```javascript
import { setupAllInstruments } from '../core/systems/performance/InstrumentationHooks.js'

// After world.init:
await world.init(config)
setupAllInstruments(world)
setupDebugGlobals(world)
```

- [ ] InstrumentationHooks imported
- [ ] setupAllInstruments() called after world.init()
- [ ] No import errors

### Step 2.2: Setup Debug Globals
**File**: `src/client/debugUtils.js`

Add after existing debug globals:
```javascript
import { createLoadTests } from '../core/systems/performance/LoadTestFramework.js'
import { RegressionDetector } from '../core/systems/performance/RegressionDetector.js'

// Inside setupDebugGlobals():
window.__DEBUG__.performanceMonitor = () => world.performanceMonitor
window.__DEBUG__.getPerformanceSnapshot = () => world.performanceMonitor?.getMetrics()

const loadTestFramework = createLoadTests(world)
window.__DEBUG__.loadTestFramework = loadTestFramework
window.__DEBUG__.runLoadTests = async () => loadTestFramework.runAll()

const baseline = await fetch('/performance-baseline.json').then(r => r.json()).catch(() => null)
const detector = new RegressionDetector(baseline)
window.__DEBUG__.regressionDetector = detector
window.__DEBUG__.getRegressionReport = () => detector.getReport()

window.__DEBUG__.togglePerformance = (visible) => {
  world.performanceMonitor?.toggle(visible ?? !world.performanceMonitor?.active)
}
```

- [ ] LoadTestFramework imported
- [ ] RegressionDetector imported
- [ ] All debug globals registered
- [ ] No console errors on startup

## Phase 3: Input Integration

### Step 3.1: Register Keyboard Shortcut
**File**: Input handler (e.g., `src/core/systems/controls/ClientControls.js` or keyboard event listener)

Add to keyboard event handler:
```javascript
if (e.ctrlKey && e.key === 'p') {
  e.preventDefault()
  const monitor = this.world.performanceMonitor
  if (monitor) {
    monitor.toggle(!monitor.active)
  }
}
```

- [ ] Ctrl+P handler added to keyboard events
- [ ] Prevents default browser behavior
- [ ] Toggles performance display visibility
- [ ] Tested: Ctrl+P toggles display on/off

## Phase 4: Network Integration

### Step 4.1: Add Network Monitoring
**File**: `src/core/systems/ClientNetwork.js`

In the `send()` method:
```javascript
send(type, data) {
  // ... existing code ...

  // Record performance metrics
  const size = JSON.stringify(data || {}).length
  this.world.performanceMonitor?.recordNetworkMessage(type, size)
}
```

In the message handler for pong:
```javascript
handlePong(time) {
  const latency = performance.now() - time
  this.world.performanceMonitor?.recordNetworkLatency(latency)

  // ... existing pong handling ...
}
```

- [ ] recordNetworkMessage() calls added to send()
- [ ] recordNetworkLatency() calls added to pong handler
- [ ] No syntax errors
- [ ] Network metrics appear in performance display

## Phase 5: Asset Setup

### Step 5.1: Copy Baseline File
**File**: `performance-baseline.json` → `public/performance-baseline.json`

```bash
cp performance-baseline.json public/performance-baseline.json
```

- [ ] Baseline file copied to public/
- [ ] File served at: `http://localhost:3000/performance-baseline.json`
- [ ] Verify: Open URL in browser, should see JSON

### Step 5.2: Verify Baseline Loading
In browser console:
```javascript
fetch('/performance-baseline.json')
  .then(r => r.json())
  .then(data => console.log('Baseline:', data))
  .catch(e => console.error('Failed:', e))
```

- [ ] Baseline file loads successfully
- [ ] No 404 errors
- [ ] JSON parses correctly

## Phase 6: Testing

### Step 6.1: Manual Testing
In browser while running dev server:

```javascript
// Check if performance monitor exists
window.__DEBUG__.performanceMonitor()

// Toggle display (or press Ctrl+P)
window.__DEBUG__.togglePerformance(true)

// Check metrics
window.__DEBUG__.getPerformanceSnapshot()
```

Test Results:
- [ ] Performance display appears in top-right corner
- [ ] Display shows real metrics (FPS, Memory, etc.)
- [ ] Metrics update every frame
- [ ] Ctrl+P toggles visibility
- [ ] No console errors

### Step 6.2: Load Test
In browser console:
```javascript
const results = await window.__DEBUG__.runLoadTests()
console.table(results)
```

Test Results:
- [ ] All load tests complete
- [ ] No unhandled errors
- [ ] Results show reasonable timings
- [ ] Memory usage reasonable

### Step 6.3: Regression Detection
In browser console:
```javascript
window.__DEBUG__.getRegressionReport()
```

Test Results:
- [ ] Report generates successfully
- [ ] Shows performance trends
- [ ] Detects any regressions
- [ ] Lists recent snapshots

### Step 6.4: Automated Tests
```bash
npm run test -- tests/performance.test.js
```

Test Results:
- [ ] All tests pass
- [ ] No timeouts
- [ ] Metrics within expected ranges
- [ ] Browser context closes cleanly

## Phase 7: Configuration

### Step 7.1: Review Baseline Thresholds
**File**: `performance-baseline.json`

Default thresholds:
- Frame Time Target: 16.67ms
- Memory Peak: 200MB
- Network Latency: 50ms
- Physics Step: 3ms

- [ ] Review targets match your goals
- [ ] Adjust thresholds if needed
- [ ] Save changes
- [ ] Restart dev server to load new baseline

### Step 7.2: Optional - Adjust Sample Size
**File**: `src/core/systems/performance/PerformanceMetrics.js`

```javascript
this.maxSamples = 100  // Increase for more history
```

- [ ] If you want longer metric history, increase maxSamples
- [ ] Note: Higher values use more memory
- [ ] Default (100) is suitable for most uses

## Phase 8: Verification

### Final Checks

- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] Website loads in browser
- [ ] Ctrl+P toggles performance display
- [ ] Performance metrics update in real-time
- [ ] Load tests run successfully
- [ ] No console errors or warnings
- [ ] All integration steps completed

### Performance Display Content

The overlay should show:
```
PERFORMANCE MONITOR
─────────────────────
Frame: XX.XXms (XX FPS)
Memory: XXX.XX MB (peak: XXX.XX MB, growth: XXX.XX MB)
Network: latency XXms
Entities Spawn: XX.XXms
Physics: X.XXms (XXXXX steps)
Rendering: X.XXms
Scripts: errors: X, warnings: X
Raycast: XXX queries
─────────────────────
Uptime: XXX.Xs
```

- [ ] Frame time shows reasonable value (16-50ms)
- [ ] Memory shows initial value (50-150MB)
- [ ] Network latency appears
- [ ] Physics simulation time shows
- [ ] Rendering time displayed
- [ ] Uptime counter increments

## Troubleshooting

If any step fails, refer to:

| Issue | Reference |
|-------|-----------|
| System not registering | Check SystemRegistry.js imports |
| Display not showing | Check debugUtils.js setup |
| Keyboard shortcut not working | Check input handler registration |
| Network metrics missing | Check ClientNetwork.js integration |
| Baseline not loading | Check file location and fetch() call |
| Tests failing | Check Playwright is installed |
| Metrics all zero | Re-run setupAllInstruments(world) |

## Common Issues & Solutions

### "performanceMonitor is not defined"
- Verify PerformanceMonitor registered in SystemRegistry
- Check system name matches: 'performanceMonitor' (lowercase)

### "Cannot read property 'toggle' of undefined"
- Verify debugUtils.js properly initializes monitor
- Check setupAllInstruments() is called

### "Baseline file not found"
- Copy file: `cp performance-baseline.json public/`
- Restart dev server
- Check file at: `http://localhost:3000/performance-baseline.json`

### "Ctrl+P not working"
- Verify keyboard handler registered
- Check handler checks for `ctrlKey && key === 'p'`
- Ensure preventDefault() called

### "Memory always 0"
- Check if browser supports `performance.memory` (Chrome/Edge/Firefox)
- Safari doesn't expose memory API
- Use DevTools Memory tab as alternative

## Success Criteria

- [x] All 7 integration phases completed
- [x] Manual testing passes all checks
- [x] Load tests run without errors
- [x] Automated tests passing
- [x] Performance display visible and updating
- [x] No console errors or warnings
- [x] Build completes successfully

## Next Steps

Once integration is complete:

1. **Capture Baseline** - Run load tests to get real metrics
2. **Monitor Regularly** - Check performance during development
3. **Detect Regressions** - Use regression detection for code changes
4. **Optimize** - Use metrics to identify bottlenecks
5. **Scale Test** - Run with multiple players to understand limits

## Documentation

- **Full Guide**: `PERFORMANCE_MONITORING.md`
- **Integration Steps**: `PERFORMANCE_INTEGRATION_GUIDE.md`
- **Quick Commands**: `PERFORMANCE_QUICK_REFERENCE.md`
- **Implementation Overview**: `PERFORMANCE_BASELINE_SUMMARY.md`

## Support

For issues or questions:
1. Check PERFORMANCE_QUICK_REFERENCE.md for common commands
2. Review PERFORMANCE_INTEGRATION_GUIDE.md for detailed steps
3. Check browser console for specific error messages
4. Run automated tests to verify integration
5. Refer to troubleshooting section above

---

**Last Updated**: 2025-12-27
**Status**: Ready for Integration
**Estimated Integration Time**: 30-45 minutes

