# Performance Monitoring Integration Guide

This guide explains how to integrate the performance monitoring system into the Hyperfy World.

## Prerequisites

The performance monitoring system is designed as a drop-in addition to the World system. It requires:
- Existing World instance with standard systems
- Browser with performance.memory API (Chrome, Edge, Firefox)
- ES6 module system

## Integration Steps

### Step 1: Register PerformanceMonitor System

Add to `src/core/systems/SystemRegistry.js`:

```javascript
import { PerformanceMonitor } from './PerformanceMonitor.js'

export const systemRegistry = {
  // ... existing systems
  clientSystems: [
    // ... existing systems
    { name: 'performanceMonitor', class: PerformanceMonitor },
  ]
}
```

### Step 2: Initialize Instrumentation Hooks

Add to `src/client/world-client.js` after world initialization:

```javascript
import { setupAllInstruments } from '../core/systems/performance/InstrumentationHooks.js'

// After world.init() completes:
setupAllInstruments(world)
```

### Step 3: Setup Debug Globals

Update `src/client/debugUtils.js`:

```javascript
import { createLoadTests } from './systems/performance/LoadTestFramework.js'
import { RegressionDetector } from './systems/performance/RegressionDetector.js'

export function setupDebugGlobals(world) {
  // ... existing globals

  // Performance monitoring
  window.__DEBUG__.performanceMonitor = () => world.performanceMonitor
  window.__DEBUG__.performanceMetrics = () => world.performanceMonitor?.metrics
  window.__DEBUG__.getPerformanceSnapshot = () => world.performanceMonitor?.getMetrics()

  // Load testing
  const loadTestFramework = createLoadTests(world)
  window.__DEBUG__.loadTestFramework = loadTestFramework
  window.__DEBUG__.runLoadTests = async () => loadTestFramework.runAll()

  // Regression detection
  const baseline = await fetch('/performance-baseline.json').then(r => r.json()).catch(() => null)
  const detector = new RegressionDetector(baseline)
  window.__DEBUG__.regressionDetector = detector
  window.__DEBUG__.getRegressionReport = () => detector.getReport()

  // Performance toggle
  window.__DEBUG__.togglePerformance = (visible) => {
    world.performanceMonitor?.toggle(visible ?? !world.performanceMonitor?.active)
  }
}
```

### Step 4: Add Keyboard Shortcut

Add to input handler (e.g., `src/core/systems/controls/ClientControls.js`):

```javascript
// In keyboard event handler
if (e.ctrlKey && e.key === 'p') {
  e.preventDefault()
  const monitor = this.world.performanceMonitor
  if (monitor) {
    monitor.toggle(!monitor.active)
  }
}
```

### Step 5: Load Baseline File

Ensure `performance-baseline.json` is served at root:
- Copy to `public/performance-baseline.json`
- PerformanceMonitor.setupBaselineCheck() will auto-load it
- Falls back gracefully if file not found

### Step 6: Add Network Monitoring

Add to `src/core/systems/ClientNetwork.js`:

```javascript
// In network message send method
send(type, data) {
  // ... existing code

  // Record metrics
  const size = JSON.stringify(data || {}).length
  this.world.performanceMonitor?.recordNetworkMessage(type, size)
}

// In network receive handler (pong response)
handlePong(time) {
  const latency = performance.now() - time
  this.world.performanceMonitor?.recordNetworkLatency(latency)
}
```

## Configuration

### Baseline Thresholds

Edit `performance-baseline.json` to adjust thresholds:

```json
{
  "frameTime": {
    "target": 16.67,
    "warning": 25,
    "critical": 50
  },
  "memory": {
    "initial": 50,
    "peak": 200,
    "critical": 400,
    "growthRate": 0.1
  }
}
```

### Metric Sampling

Modify `PerformanceMetrics.js` to change sample size:

```javascript
this.maxSamples = 100  // Increase for more history
```

### Regression Multipliers

Adjust in `performance-baseline.json`:

```json
{
  "regressionDetection": {
    "frameTimeMultiplier": 2.0,
    "memoryGrowthMultiplier": 1.5,
    "latencyMultiplier": 2.0
  }
}
```

## Usage Examples

### Basic Monitoring

```javascript
// Start monitoring
const monitor = world.performanceMonitor
monitor.toggle(true)

// Get current metrics
const metrics = monitor.getMetrics()
console.log(`FPS: ${(1000 / metrics.frameTime.avg).toFixed(0)}`)
console.log(`Memory: ${metrics.memory.current}MB`)
```

### Load Testing

```javascript
// Run single test
const framework = window.__DEBUG__.loadTestFramework
const results = await framework.runTest({
  name: 'Custom Test',
  config: {},
  testFn: async (world) => {
    for (let i = 0; i < 100; i++) {
      world.entities.create('box', {})
      await new Promise(r => setTimeout(r, 10))
    }
  }
})

// Run all tests
const allResults = await framework.runAll()
allResults.forEach(r => console.log(r))
```

### Regression Detection

```javascript
// Check for regressions
const detector = window.__DEBUG__.regressionDetector
const report = detector.getReport()

if (report.trend.direction === 'degrading') {
  console.warn('Performance degrading:', report.trend)
}

// View recent snapshots
report.snapshots.slice(-10).forEach(s => {
  console.log(`${s.time}: ${s.frameTime}ms frame time`)
})
```

### Performance Analysis

```javascript
// Check if meeting targets
const metrics = monitor.getMetrics()
const baseline = performance.baseline || {}

const issues = []
if (metrics.frameTime.avg > baseline.frameTime.warning) {
  issues.push(`Frame time high: ${metrics.frameTime.avg.toFixed(2)}ms`)
}
if (parseFloat(metrics.memory.growth) > baseline.memory.critical) {
  issues.push(`Memory growth excessive: ${metrics.memory.growth}MB`)
}

if (issues.length > 0) {
  console.error('Performance issues:', issues)
} else {
  console.log('All metrics within thresholds')
}
```

## Testing Integration

### Manual Testing Checklist

- [ ] Performance display toggles with Ctrl+P
- [ ] Frame time updates every frame
- [ ] Memory usage reflects actual heap
- [ ] Network latency measures correctly
- [ ] Regression detection alerts on threshold breach
- [ ] Load tests complete without errors
- [ ] Baseline file loads successfully

### Automated Testing

Run Playwright performance tests:

```bash
# Run all performance tests
npx playwright test tests/performance.test.js

# Run specific test
npx playwright test tests/performance.test.js -g "single player baseline"

# Watch mode
npx playwright test tests/performance.test.js --watch
```

## Troubleshooting

### Performance Display Not Showing

```javascript
// Check if monitor exists
console.log(window.__DEBUG__.world.performanceMonitor)

// Check if display created
console.log(window.__DEBUG__.world.performanceMonitor?.display?.dom)

// Try manual toggle
window.__DEBUG__.togglePerformance(true)
```

### Metrics All Zero

```javascript
// Check if instrumentation hooks applied
console.log(typeof world.physics.step)

// Re-run setup
import { setupAllInstruments } from '../core/systems/performance/InstrumentationHooks.js'
setupAllInstruments(world)
```

### Baseline File Not Loading

```javascript
// Check if file accessible
fetch('/performance-baseline.json')
  .then(r => r.json())
  .then(data => console.log('Baseline loaded:', data))
  .catch(e => console.error('Baseline load failed:', e))
```

### Memory Metrics Unavailable

```javascript
// Check if performance.memory API available
console.log('Memory API:', performance.memory ? 'available' : 'unavailable')
console.log('Memory:', performance.memory?.usedJSHeapSize / 1024 / 1024, 'MB')
```

## Performance Impact

The monitoring system has minimal performance overhead:

- **Frame time**: <0.5ms per frame for collection only
- **Memory**: ~5MB for metrics storage
- **Network**: Negligible (ping sent at 0.5Hz)
- **Display overlay**: ~1-2ms per frame when visible

When not visible, performance impact is negligible.

## Advanced Configuration

### Custom Metrics

Add custom metric collection to `PerformanceMetrics.js`:

```javascript
recordCustomMetric(name, value) {
  if (!this.custom) this.custom = {}
  if (!this.custom[name]) {
    this.custom[name] = { samples: [], sum: 0 }
  }
  const entry = this.custom[name]
  if (entry.samples.length >= this.maxSamples) {
    entry.sum -= entry.samples.shift()
  }
  entry.samples.push(value)
  entry.sum += value
}
```

### Extended Baseline

Add to `performance-baseline.json`:

```json
{
  "custom": {
    "aiResponseTime": {
      "target": 100,
      "warning": 500,
      "critical": 2000
    }
  }
}
```

### Export Metrics

Add export function:

```javascript
export function exportMetrics(monitor) {
  const snapshot = monitor.getMetrics()
  const csv = [
    ['Metric', 'Value', 'Unit'],
    ['Frame Time Avg', snapshot.frameTime.avg, 'ms'],
    ['Memory Current', snapshot.memory.current, 'MB'],
    ['Network Latency', snapshot.network.avgLatency, 'ms'],
  ]

  const text = csv.map(row => row.join(',')).join('\n')
  const blob = new Blob([text], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `metrics-${Date.now()}.csv`
  a.click()
}
```

## Best Practices

1. **Run baseline on clean build** - No other workloads
2. **Test at different scales** - Single player, 4-player, 10+ player scenarios
3. **Monitor long-running sessions** - 1-hour tests for memory leaks
4. **Compare before/after** - Code changes should be validated with performance tests
5. **Document regressions** - Track which changes caused which regressions
6. **Automate tests** - Run performance tests in CI/CD pipeline

## Metrics to Track

Essential metrics for production:

1. **Frame Time** - Most critical for user experience
2. **Memory Growth** - Indicates leaks
3. **Network Latency** - Critical for multiplayer feel
4. **Script Errors** - Indicates system health
5. **Physics Time** - Early indicator of load issues

High-priority optimizations when regression detected:

1. Frame time >25ms - Focus on rendering or physics
2. Memory growth >0.5MB/hour - Look for leaks
3. Latency >200ms - Network or server load
4. Script errors - Debug failing systems

## Migration Notes

If upgrading existing performance monitoring:

1. **StatsGL vs PerformanceMonitor** - StatsGL provides low-level rendering metrics, PerformanceMonitor provides system-wide analysis
2. **Can run both** - They don't conflict
3. **Performance overhead** - PerformanceMonitor is lighter weight
4. **Feature parity** - PerformanceMonitor covers more systems

