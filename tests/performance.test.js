import { test, expect } from '@playwright/test'

test.describe('Performance Benchmarks', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('single player baseline frame time', async () => {
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        const startTime = performance.now()
        const samples = []
        let frameCount = 0

        function measureFrame() {
          frameCount++
          if (frameCount < 60) {
            requestAnimationFrame(measureFrame)
          } else {
            const duration = performance.now() - startTime
            const avgTime = duration / 60
            resolve({
              frameTime: avgTime,
              fps: 1000 / avgTime,
              duration,
            })
          }
        }

        requestAnimationFrame(measureFrame)
      })
    })

    console.log('Single player baseline:', metrics)
    expect(metrics.frameTime).toBeLessThan(50)
  })

  test('memory usage baseline', async () => {
    const memory = await page.evaluate(() => {
      if (!performance.memory) return null
      const initialMemory = performance.memory.usedJSHeapSize / 1024 / 1024

      return new Promise(resolve => {
        setTimeout(() => {
          const finalMemory = performance.memory.usedJSHeapSize / 1024 / 1024
          resolve({
            initial: initialMemory.toFixed(2),
            final: finalMemory.toFixed(2),
            growth: (finalMemory - initialMemory).toFixed(2),
          })
        }, 60000)
      })
    })

    console.log('Memory baseline:', memory)
    if (memory) {
      expect(parseFloat(memory.growth)).toBeLessThan(100)
    }
  })

  test('entity spawn performance', async () => {
    const result = await page.evaluate(async () => {
      const world = window.__DEBUG__.world
      if (!world) throw new Error('World not initialized')

      const times = []
      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        try {
          world.entities.create('box', {
            position: { x: Math.random() * 100, y: 0, z: Math.random() * 100 },
          })
        } catch (e) {
          return null
        }
        times.push(performance.now() - start)
        await new Promise(r => setTimeout(r, 10))
      }

      return {
        count: times.length,
        avgTime: (times.reduce((a, b) => a + b) / times.length).toFixed(2),
        minTime: Math.min(...times).toFixed(2),
        maxTime: Math.max(...times).toFixed(2),
      }
    })

    if (result) {
      console.log('Entity spawn performance:', result)
      expect(parseFloat(result.avgTime)).toBeLessThan(50)
    }
  })

  test('network latency measurement', async () => {
    const server = await page.context().newPage()
    await server.goto('http://localhost:3000')

    const latencies = []
    for (let i = 0; i < 30; i++) {
      const latency = await page.evaluate(() => {
        const start = performance.now()
        return new Promise(resolve => {
          window.__DEBUG__.network?.send?.('ping', Date.now())
          setTimeout(() => {
            resolve(performance.now() - start)
          }, 100)
        })
      })
      latencies.push(latency)
      await page.waitForTimeout(100)
    }

    const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length
    console.log('Network latency:', {
      avg: avgLatency.toFixed(2),
      min: Math.min(...latencies).toFixed(2),
      max: Math.max(...latencies).toFixed(2),
    })

    expect(avgLatency).toBeLessThan(200)
    await server.close()
  })

  test('physics simulation performance', async () => {
    const result = await page.evaluate(() => {
      const world = window.__DEBUG__.world
      if (!world?.physics) return null

      const initialTime = performance.now()
      let stepCount = 0
      const timings = []

      const measureInterval = setInterval(() => {
        const elapsed = performance.now() - initialTime
        if (elapsed > 5000) {
          clearInterval(measureInterval)
          return
        }
        stepCount++
        const stepTime = world.physics.lastStepTime || 0
        timings.push(stepTime)
      }, 16)

      return new Promise(resolve => {
        setTimeout(() => {
          clearInterval(measureInterval)
          resolve({
            stepCount,
            avgTime: (timings.reduce((a, b) => a + b) / timings.length).toFixed(2),
          })
        }, 5000)
      })
    })

    if (result) {
      console.log('Physics simulation:', result)
      expect(parseFloat(result.avgTime)).toBeLessThan(20)
    }
  })

  test('raycast query performance', async () => {
    const result = await page.evaluate(() => {
      const world = window.__DEBUG__.world
      const stage = world?.stage
      if (!stage?.raycast) return null

      const timings = []
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        try {
          stage.raycast({
            origin: { x: 0, y: 5, z: 0 },
            direction: { x: 0, y: -1, z: 0 },
            distance: 100,
          })
        } catch (e) {
          continue
        }
        timings.push(performance.now() - start)
      }

      return {
        count: timings.length,
        avgTime: (timings.reduce((a, b) => a + b) / timings.length).toFixed(2),
        maxTime: Math.max(...timings).toFixed(2),
      }
    })

    if (result) {
      console.log('Raycast performance:', result)
      expect(parseFloat(result.avgTime)).toBeLessThan(5)
    }
  })

  test('script execution performance', async () => {
    const result = await page.evaluate(() => {
      const world = window.__DEBUG__.world
      if (!world?.scripts) return null

      const timings = []
      const scriptCode = '() => { let sum = 0; for (let i = 0; i < 1000; i++) sum += i; return sum; }'

      for (let i = 0; i < 20; i++) {
        const start = performance.now()
        try {
          const fn = eval(scriptCode)
          fn()
        } catch (e) {
          continue
        }
        timings.push(performance.now() - start)
      }

      return {
        count: timings.length,
        avgTime: (timings.reduce((a, b) => a + b) / timings.length).toFixed(4),
        maxTime: Math.max(...timings).toFixed(4),
      }
    })

    if (result) {
      console.log('Script execution:', result)
      expect(parseFloat(result.avgTime)).toBeLessThan(5)
    }
  })

  test('load test: 50 entities', async () => {
    const result = await page.evaluate(async () => {
      const world = window.__DEBUG__.world
      if (!world) return null

      const startTime = performance.now()
      const entities = []

      for (let i = 0; i < 50; i++) {
        try {
          const entity = world.entities.create('box', {
            position: {
              x: (i % 10) * 2,
              y: Math.floor(i / 10) * 2,
              z: 0,
            },
          })
          entities.push(entity)
        } catch (e) {
          continue
        }

        if (i % 10 === 0) {
          await new Promise(r => setTimeout(r, 10))
        }
      }

      const duration = performance.now() - startTime
      return {
        count: entities.length,
        duration: duration.toFixed(2),
        avgSpawnTime: (duration / entities.length).toFixed(2),
      }
    })

    if (result) {
      console.log('50 entity load test:', result)
      expect(parseFloat(result.avgSpawnTime)).toBeLessThan(100)
    }
  })
})
