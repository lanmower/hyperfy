# Performance Monitoring Quick Reference

## Enable Monitoring

Press `Ctrl+P` in browser to toggle performance display.

## In Browser Console

```javascript
// Toggle performance display
window.__DEBUG__.togglePerformance(true)

// Get current metrics
const m = window.__DEBUG__.getPerformanceSnapshot()

// Frame rate
console.log('FPS:', (1000 / m.frameTime.avg).toFixed(0))

// Memory
console.log('Memory:', m.memory.current, 'MB (growth:', m.memory.growth, 'MB)')

// Network latency
console.log('Latency:', m.network.avgLatency, 'ms')

// Physics time
console.log('Physics:', m.physics.avgSimTime, 'ms per step')

// Script errors
console.log('Errors:', m.scripts.errorCount, 'Warnings:', m.scripts.warningCount)
```

## Load Testing

```javascript
// Run all load tests
const results = await window.__DEBUG__.runLoadTests()
results.forEach(test => console.log(test.name, test.status))

// Check specific scenario
const loaded = results.find(r => r.name.includes('50 Entities'))
console.log('50 entity load test:', loaded)
```

## Performance Analysis

```javascript
// Get regression report
const report = window.__DEBUG__.getRegressionReport()

// Check if degrading
if (report.trend?.direction === 'degrading') {
  console.warn('Performance degrading:', report.trend.trend, '%')
}

// View performance timeline
report.snapshots.forEach(s => {
  console.log(`${s.frameTime}ms frame time`)
})
```

## Quick Diagnostics

```javascript
// Health check
const m = window.__DEBUG__.getPerformanceSnapshot()
const issues = []

if (m.frameTime.avg > 25) issues.push('Frame time high')
if (parseFloat(m.memory.growth) > 100) issues.push('Memory growing fast')
if (parseFloat(m.network.avgLatency) > 200) issues.push('Network latency high')
if (m.scripts.errorCount > 0) issues.push('Script errors')

console.log(issues.length === 0 ? 'All systems healthy' : 'Issues: ' + issues.join(', '))
```

## Baseline Thresholds

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Frame Time | 16.67ms | 25ms | 50ms |
| Memory | 50MB | 250MB | 400MB |
| Network Latency | 50ms | 200ms | 500ms |
| Physics Step | 3ms | 5ms | 20ms |
| Script Error Count | 0 | 1+ | 5+ |

## Performance Problems & Solutions

### Black Screen / Very Low FPS

```javascript
const m = window.__DEBUG__.getPerformanceSnapshot()
if (m.frameTime.avg > 100) {
  console.log('Rendering bottleneck')
  // Check draw calls
  console.log('Draw calls:', m.rendering.drawCalls)
  // Check triangles
  console.log('Triangles:', m.rendering.triangles)
}
```

### High Memory Usage

```javascript
// Check growth rate
const m = window.__DEBUG__.getPerformanceSnapshot()
console.log('Memory growth:', m.memory.growth, 'MB')
if (parseFloat(m.memory.growth) > 50) {
  console.warn('Possible memory leak')
  // Check script errors
  console.log('Scripts errors:', m.scripts.errorCount)
}
```

### Lag Spikes

```javascript
const m = window.__DEBUG__.getPerformanceSnapshot()
if (m.frameTime.max > 100) {
  console.log('Lag spikes detected')
  console.log('Peak frame time:', m.frameTime.max, 'ms')
  console.log('Network latency:', m.network.avgLatency, 'ms')
}
```

## Files Created

- `src/core/systems/PerformanceMonitor.js` - Main monitoring system
- `src/core/systems/performance/PerformanceMetrics.js` - Data collection
- `src/core/systems/performance/PerformanceDisplay.js` - Visual overlay
- `src/core/systems/performance/LoadTestFramework.js` - Load tests
- `src/core/systems/performance/InstrumentationHooks.js` - System hooks
- `src/core/systems/performance/RegressionDetector.js` - Regression analysis
- `performance-baseline.json` - Reference baseline
- `tests/performance.test.js` - Playwright tests
- `PERFORMANCE_MONITORING.md` - Full documentation
- `PERFORMANCE_INTEGRATION_GUIDE.md` - Integration instructions

## Next Steps

1. **Integrate into World** - Follow PERFORMANCE_INTEGRATION_GUIDE.md
2. **Run baseline** - Capture reference metrics on clean build
3. **Run load tests** - `await window.__DEBUG__.runLoadTests()`
4. **Monitor regressions** - Check report with `window.__DEBUG__.getRegressionReport()`
5. **Set thresholds** - Adjust baseline for your targets

## Performance Targets

### Single Player
- Frame Time: 16-20ms (50-60 FPS)
- Memory: 50-100MB
- Network: Not critical

### 4 Players
- Frame Time: 20-30ms (30-50 FPS)
- Memory: 100-200MB
- Network Latency: <100ms

### 10+ Players
- Frame Time: 30-50ms (20-30 FPS)
- Memory: 200-400MB
- Network Latency: <200ms

## Monitor Integration Checklist

- [ ] System registered in SystemRegistry.js
- [ ] Instrumentation hooks applied in world-client.js
- [ ] Debug globals created in debugUtils.js
- [ ] Keyboard shortcut registered (Ctrl+P)
- [ ] Baseline file in public/performance-baseline.json
- [ ] Network monitoring added to ClientNetwork.js
- [ ] Performance tests passing

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+P | Toggle performance display |

## Common Commands

```javascript
// Show performance display
window.__DEBUG__.togglePerformance(true)

// Hide performance display
window.__DEBUG__.togglePerformance(false)

// Get all metrics
window.__DEBUG__.getPerformanceSnapshot()

// Run load tests
window.__DEBUG__.runLoadTests()

// Get regression report
window.__DEBUG__.getRegressionReport()

// Reset metrics
window.__DEBUG__.performanceMonitor().reset()

// Export metrics
window.__DEBUG__.getPerformanceSnapshot() // Copy JSON
```

## Debugging Tips

1. **Check browser console** for error messages
2. **Use DevTools** to see Three.js renderer stats
3. **Monitor memory** in DevTools Memory tab
4. **Run load tests** to stress system
5. **Check regressions** with `getRegressionReport()`

## References

- Performance Monitoring: `PERFORMANCE_MONITORING.md`
- Integration Guide: `PERFORMANCE_INTEGRATION_GUIDE.md`
- Baseline File: `performance-baseline.json`
- Test Suite: `tests/performance.test.js`

