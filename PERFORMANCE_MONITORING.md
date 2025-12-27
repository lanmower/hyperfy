# Performance Monitoring System

This document describes the comprehensive performance monitoring and benchmarking system for Hyperfy.

## Overview

The performance monitoring system provides:

1. **Real-time Metrics Collection** - Automatic collection of frame time, memory, network, physics, and script execution metrics
2. **Visual Performance Display** - In-world FPS counter and performance dashboard
3. **Regression Detection** - Automatic detection of performance regressions vs baseline
4. **Load Testing Framework** - Systematic testing at different scales (10, 50, 100+ entities)
5. **Instrumentation Hooks** - Performance profiling for all major systems

## Architecture

### Core Components

**PerformanceMonitor.js** - Main system
- Collects all metrics
- Manages display visibility
- Detects regressions
- Integrates with all subsystems

**PerformanceMetrics.js** - Data collection
- Tracks frame times, memory usage, network latency, physics simulation, script execution
- Maintains circular buffers of 100 samples for each metric
- Provides snapshot generation for analysis

**PerformanceDisplay.js** - Visual display
- Renders in-world performance overlay
- Shows FPS, memory, network lag, entity count, script errors
- Fixed position overlay with monospace font
- Green-on-black theme

**LoadTestFramework.js** - Load testing
- Defines standard load test scenarios
- Tracks test results and durations
- Extensible test registration system

**InstrumentationHooks.js** - System integration
- Wraps major system methods with timing code
- Records metrics at system boundaries
- Minimal performance overhead

**RegressionDetector.js** - Analysis
- Compares metrics against baseline
- Detects performance trends
- Generates regression reports

## Usage

### Enable Performance Monitoring

```javascript
// Access from window.__DEBUG__
const monitor = window.__DEBUG__.world.performanceMonitor

// Toggle display with Ctrl+P
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'p') {
    monitor.toggle(!monitor.active)
  }
})
```

### View Real-Time Metrics

```javascript
// Get current snapshot
const metrics = await page.evaluate(() =>
  window.__DEBUG__.world.performanceMonitor.getMetrics()
)

console.log('Frame Time:', metrics.frameTime.avg, 'ms')
console.log('Memory:', metrics.memory.current, 'MB')
console.log('Network Latency:', metrics.network.avgLatency, 'ms')
console.log('Physics:', metrics.physics.avgSimTime, 'ms')
```

### Run Load Tests

```javascript
// Run all load tests
const framework = window.__DEBUG__.world.loadTestFramework
const results = await framework.runAll()

results.forEach(test => {
  console.log(`${test.name}: ${test.status} (${test.duration.toFixed(2)}ms)`)
})
```

### Check Regressions

```javascript
// Get regression report
const detector = window.__DEBUG__.world.regressionDetector
const report = detector.getReport()

console.log('Performance trend:', report.trend)
console.log('Recent snapshots:', report.snapshots.slice(-5))
```

## Performance Baseline

File: `performance-baseline.json`

Contains reference values for:
- Target frame time (16.67ms for 60 FPS)
- Memory usage thresholds
- Network latency targets
- Physics simulation time budgets
- Rendering performance expectations
- Scaling thresholds for 1, 4, 11, and 50 players

Baseline structure:
```json
{
  "frameTime": { "target": 16.67, "warning": 25, "critical": 50 },
  "memory": { "initial": 50, "peak": 200, "critical": 400 },
  "network": { "latency": { "target": 50, "critical": 500 } },
  "physics": { "simTime": { "target": 3, "critical": 20 } },
  "scalingThresholds": { ... }
}
```

## Metrics Reference

### Frame Time
- **Target**: 16.67ms (60 FPS)
- **Warning**: 25ms
- **Critical**: 50ms
- Measured every frame in postUpdate

### Memory Usage
- **Tracks**: Initial, current, peak
- **Growth**: Per hour rate calculation
- **Thresholds**: Initial baseline, warning (250MB), critical (400MB)

### Network Latency
- **Tracks**: RTT measurements every 500ms
- **Samples**: Last 30 measurements
- **Targets**: 50ms acceptable, 500ms critical

### Physics Simulation
- **Tracks**: Per-step simulation time
- **Targets**: 3ms per step
- **Warning**: >5ms, Critical: >20ms

### Script Execution
- **Per-script timing**: Named execution duration
- **Error/Warning tracking**: Count and stack
- **Threshold**: >50ms warns of slow scripts

### Raycast Queries
- **Count**: Total queries
- **Timing**: Per-query duration
- **Target**: <1ms per query

### Rendering
- **Draw calls**: Per frame
- **Triangles**: Polygon count
- **Textures**: Memory in use
- **Update time**: CPU time for render setup

## Regression Detection

Automatic detection triggers warnings for:
- **Frame time regression**: 2x slower than baseline
- **Memory growth**: >1.5x expected growth rate
- **Network latency**: 2x slower than baseline
- **Physics slowdown**: Step time >2x target
- **Script errors**: Any uncaught errors

Regression levels:
- **Warning**: Metric exceeds threshold but functional
- **Critical**: Metric exceeds critical threshold, may impact UX

## Load Test Scenarios

### Single Player Baseline
- 1 player, 0 remote players
- Measures baseline performance
- Target: 16.67ms frame time

### 10 Entities
- Spawn 10 dynamic objects
- Measure per-entity spawn time
- Target: <10ms per entity

### 50 Entities
- Spawn 50 distributed objects
- Measure total load time
- Target: <500ms total

### 100 Entities
- Spawn 100 objects across map
- Stress test entity system
- Target: <1000ms total

### 10 Physics Bodies
- Create 10 dynamic bodies
- Measure physics initialization
- Target: <50ms total

### 100 Network Messages
- Send rapid network updates
- Measure message throughput
- Target: <100ms for 100 messages

### 1 Hour Memory Test
- Run application for 1 hour
- Monitor memory growth
- Target: <0.1MB per hour growth

## Integration Points

### Stage System
- Tracks draw calls, triangle count, texture memory
- Hooks into render method

### Physics System
- Records simulation time per step
- Tracks dynamic body count

### Entities System
- Records spawn/despawn timing
- Tracks entity lifecycle

### Network System
- Records message types and sizes
- Measures latency via ping/pong

### Scripts System
- Records per-script execution time
- Tracks error/warning counts

## Debug Globals

Available in `window.__DEBUG__`:

```javascript
window.__DEBUG__.performanceMetrics        // Current metrics object
window.__DEBUG__.performanceMonitor        // Monitor system instance
window.__DEBUG__.loadTestFramework        // Load test runner
window.__DEBUG__.regressionDetector       // Regression analysis
```

### Example Debug Commands

```javascript
// Check frame time
const metrics = window.__DEBUG__.performanceMonitor.getMetrics()
console.log(metrics.frameTime)

// Run all load tests
const results = await window.__DEBUG__.loadTestFramework.runAll()

// Get regression report
const report = window.__DEBUG__.regressionDetector.getReport()

// Toggle performance display
window.__DEBUG__.performanceMonitor.toggle(true)
```

## Key Files

- `/c/dev/hyperfy/src/core/systems/PerformanceMonitor.js` - Main system
- `/c/dev/hyperfy/src/core/systems/performance/PerformanceMetrics.js` - Data collection
- `/c/dev/hyperfy/src/core/systems/performance/PerformanceDisplay.js` - Visual overlay
- `/c/dev/hyperfy/src/core/systems/performance/LoadTestFramework.js` - Load tests
- `/c/dev/hyperfy/src/core/systems/performance/InstrumentationHooks.js` - System hooks
- `/c/dev/hyperfy/src/core/systems/performance/RegressionDetector.js` - Regression analysis
- `/c/dev/hyperfy/performance-baseline.json` - Reference baseline values
- `/c/dev/hyperfy/tests/performance.test.js` - Playwright performance tests

## Keyboard Shortcuts

- **Ctrl+P**: Toggle performance display visibility

## Performance Optimization Tips

Based on regression detection alerts:

### High Frame Time (>25ms)
- Reduce draw calls (batch rendering)
- Reduce triangle count (LOD system)
- Check physics simulation time
- Check script execution time

### High Memory Growth
- Check for memory leaks in scripts
- Verify entity cleanup on despawn
- Monitor texture/audio loading
- Check if objects are being removed from scene

### High Network Latency
- Check server load
- Monitor message frequency
- Verify compression working
- Consider message batching

### Slow Physics
- Reduce dynamic body count
- Check collision detection overhead
- Verify PhysX initialization

### Slow Scripts
- Profile script execution
- Reduce computation in hot paths
- Use pooling for frequent allocations

## Testing Performance

### Browser DevTools Integration

```javascript
// In browser console
// Check Three.js renderer info
const renderer = window.__DEBUG__.world.stage.renderer
console.log(renderer.info.render)

// Monitor memory
setInterval(() => {
  if (performance.memory) {
    console.log(
      'Memory:',
      (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      'MB'
    )
  }
}, 1000)
```

### Playwright Testing

Run automated performance tests:
```bash
npx playwright test tests/performance.test.js
```

Tests included:
- Single player baseline
- Memory usage over time
- Entity spawn performance
- Network latency
- Physics simulation
- Raycast query time
- Script execution speed
- Load test with 50 entities

## Future Enhancements

1. **Detailed profiling** - Per-method timing in systems
2. **Memory breakdown** - Track allocation by category
3. **Network analysis** - Message type breakdown
4. **Threaded load testing** - Simulate multiple concurrent players
5. **Historical tracking** - Store metrics over time for trend analysis
6. **Export/reporting** - Generate performance reports
7. **Automated alerting** - WebSocket notifications for regressions
8. **A/B testing** - Compare performance of code changes

## Contributing

When adding new performance-critical systems:

1. Create instrumentation hook in `InstrumentationHooks.js`
2. Register metrics collection in `PerformanceMetrics.js`
3. Update baseline thresholds in `performance-baseline.json`
4. Add regression checks in `RegressionDetector.js`
5. Add test cases in `tests/performance.test.js`

