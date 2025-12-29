# Blockchain Validation & Testing Guide

This document provides step-by-step validation procedures for blockchain-dependent features. **All procedures must be executed on target blockchain before production deployment.**

## Pre-Deployment Validation Checklist

### Phase 1: Blockchain Configuration Verification

**Objective**: Confirm actual blockchain behavior matches assumptions.

**Procedure**:
```javascript
// 1. Measure block speed
async function validateBlockSpeed() {
  const block1 = await provider.getBlock('latest')
  await sleep(5000) // Wait 5 seconds
  const block2 = await provider.getBlock('latest')

  const blockDifference = block2.number - block1.number
  const blockTime = 5000 / blockDifference // ms per block

  console.log(`Block time: ${blockTime.toFixed(2)}ms`)
  console.log(`Blocks per second: ${(blockDifference / 5).toFixed(2)}`)

  if (blockTime > 15000) {
    console.warn('Block time exceeds 15 seconds - may impact system')
  }

  return blockTime
}

// 2. Test RPC limit
async function validateRpcLimit() {
  const fromBlock = (await provider.getBlock('latest')).number - 2000
  const toBlock = (await provider.getBlock('latest')).number

  try {
    const logs = await provider.getLogs({
      fromBlock,
      toBlock,
      address: '0x0000000000000000000000000000000000000000'
    })
    console.log('RPC limit: > 2000 blocks')
    return true
  } catch (error) {
    if (error.message.includes('1000')) {
      console.log('RPC limit: 1000 blocks')
      return false
    }
    throw error
  }
}

// 3. Test timestamp accuracy
async function validateBlockTimestamps() {
  const block1 = await provider.getBlock('latest')
  const block2 = await provider.getBlock(block1.number - 100)

  const timeDiff = block1.timestamp - block2.timestamp
  const expectedTime = 100 * 12 // Rough estimate for Ethereum
  const error = Math.abs(timeDiff - expectedTime) / expectedTime * 100

  console.log(`Timestamp error: ${error.toFixed(2)}%`)

  if (error > 50) {
    console.warn('Block timestamps have high variance')
  }
}
```

**Expected Results**:
- Block time: Document actual value
- RPC limit: Confirm or measure actual limit
- Timestamp variance: Should be < 50%

---

### Phase 2: Price Feed Validation

**Objective**: Confirm price feed freshness and accuracy.

**Procedure**:
```javascript
// 1. Validate price feed connection
async function validatePriceFeed() {
  const price = await getPriceFromFeed('ETH', 'USD')
  const timestamp = price.timestamp
  const age = Date.now() - timestamp

  console.log(`Price age: ${age}ms`)
  console.log(`Price: ${price.value}`)

  if (age > 5000) {
    console.warn('Price feed is stale (> 5 seconds)')
  }

  return { valid: age < 5000, age, price: price.value }
}

// 2. Compare multiple price sources
async function validatePriceAccuracy() {
  const sources = {
    'chainlink': await getChainlinkPrice('ETH'),
    'uniswap': await getUniswapPrice('ETH'),
    'manual': await getManualPrice('ETH')
  }

  const prices = Object.values(sources)
  const average = prices.reduce((a, b) => a + b) / prices.length

  for (const [source, price] of Object.entries(sources)) {
    const deviation = Math.abs(price - average) / average * 100
    console.log(`${source}: ${deviation.toFixed(2)}% deviation`)

    if (deviation > 5) {
      console.warn(`${source} price differs by > 5%`)
    }
  }
}

// 3. Test price update latency
async function validatePriceUpdateLatency() {
  const prices = []
  const updates = []

  priceWebSocket.on('price', (newPrice) => {
    prices.push(newPrice)
    updates.push(Date.now())
  })

  // Wait 1 minute and analyze
  await sleep(60000)

  const intervals = []
  for (let i = 1; i < updates.length; i++) {
    intervals.push(updates[i] - updates[i-1])
  }

  const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length
  const maxGap = Math.max(...intervals)

  console.log(`Average update interval: ${avgInterval.toFixed(0)}ms`)
  console.log(`Maximum gap between updates: ${maxGap}ms`)

  if (maxGap > 10000) {
    console.warn('Price feed gaps exceed 10 seconds')
  }
}
```

**Expected Results**:
- Feed connected: ✓
- Price deviation: < 5% between sources
- Update frequency: No gaps > 10 seconds

---

### Phase 3: Token Approval Flow Validation

**Objective**: Confirm ERC20 approval and swap process works end-to-end.

**Prerequisites**:
- Real tokens (use testnet if possible)
- Sufficient balance to test (small amount)
- Access to swap router contract

**Procedure**:
```javascript
// 1. Check initial state
async function validateInitialState(tokenIn, amount) {
  const [signer] = await ethers.getSigners()
  const owner = await signer.getAddress()
  const router = '0xRouter...'

  const balance = await tokenIn.balanceOf(owner)
  const allowance = await tokenIn.allowance(owner, router)

  console.log(`Balance: ${ethers.utils.formatEther(balance)}`)
  console.log(`Current allowance: ${ethers.utils.formatEther(allowance)}`)

  if (balance.lt(amount)) {
    throw new Error('Insufficient balance for test')
  }
}

// 2. Execute approval
async function validateApproval(tokenIn, router, amount) {
  console.log('Requesting approval...')
  const approveTx = await tokenIn.approve(router, amount)
  console.log(`Approval tx: ${approveTx.hash}`)

  const receipt = await approveTx.wait(2) // Wait 2 confirmations

  if (receipt.status !== 1) {
    throw new Error('Approval failed')
  }

  console.log('Approval confirmed')

  // Verify
  const [signer] = await ethers.getSigners()
  const owner = await signer.getAddress()
  const newAllowance = await tokenIn.allowance(owner, router)
  console.log(`New allowance: ${ethers.utils.formatEther(newAllowance)}`)
}

// 3. Execute swap
async function validateSwap(tokenIn, tokenOut, router, amountIn) {
  console.log('Executing swap...')

  const swapTx = await router.swapExactTokensForTokens(
    amountIn,
    '0', // Accept any amount (for testing)
    [tokenIn.address, tokenOut.address],
    (await ethers.getSigners())[0].address,
    Math.floor(Date.now() / 1000) + 60
  )

  console.log(`Swap tx: ${swapTx.hash}`)

  const receipt = await swapTx.wait(2)

  if (receipt.status !== 1) {
    throw new Error('Swap failed')
  }

  console.log('Swap confirmed')

  // Verify output
  const [signer] = await ethers.getSigners()
  const owner = await signer.getAddress()
  const outputBalance = await tokenOut.balanceOf(owner)
  console.log(`Output balance: ${ethers.utils.formatEther(outputBalance)}`)
}

// 4. Full flow
async function validateFullSwapFlow(tokenInAddress, tokenOutAddress, amount) {
  const tokenIn = new ethers.Contract(
    tokenInAddress,
    ERC20_ABI,
    ethers.provider.getSigner()
  )

  const tokenOut = new ethers.Contract(
    tokenOutAddress,
    ERC20_ABI,
    ethers.provider
  )

  const router = '0xRouter...'

  try {
    console.log('=== Swap Validation ===')

    await validateInitialState(tokenIn, amount)
    console.log('✓ Initial state valid')

    await validateApproval(tokenIn, router, amount)
    console.log('✓ Approval successful')

    await validateSwap(tokenIn, tokenOut, router, amount)
    console.log('✓ Swap successful')

    console.log('=== All validations passed ===')
    return true
  } catch (error) {
    console.error('Validation failed:', error.message)
    return false
  }
}
```

**Expected Results**:
- ✓ Approval transaction confirmed
- ✓ Swap transaction confirmed
- ✓ Output tokens received
- ✓ All confirmations within expected time

---

### Phase 4: Event-Driven System Validation

**Objective**: Confirm WebSocket + fallback polling works correctly.

**Procedure**:
```javascript
// 1. Test WebSocket connection
async function validateWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://...')
    let connected = false

    ws.onopen = () => {
      connected = true
      console.log('WebSocket connected')
      ws.close()
      resolve(true)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      reject(error)
    }

    setTimeout(() => {
      if (!connected) {
        reject(new Error('WebSocket timeout'))
      }
    }, 5000)
  })
}

// 2. Test fallback polling
async function validatePollingFallback() {
  let pollCount = 0
  let lastResult = null

  const poll = async () => {
    const result = await fetchLatestData()
    pollCount++

    if (result !== lastResult) {
      console.log(`Poll detected change (count: ${pollCount})`)
      lastResult = result
    }

    return result
  }

  // Poll for 30 seconds
  const pollInterval = setInterval(poll, 5000)
  await sleep(30000)
  clearInterval(pollInterval)

  console.log(`Total polls: ${pollCount}`)
  if (pollCount < 5) {
    console.warn('Polling rate is very slow')
  }
}

// 3. Test recovery from WebSocket failure
async function validateFallbackRecovery() {
  // Establish WebSocket connection
  const ws = new WebSocket('wss://...')
  let wsEvents = 0
  let pollEvents = 0

  ws.onmessage = (event) => {
    wsEvents++
  }

  // Start polling as fallback
  let fallbackActive = false
  const setupFallback = () => {
    if (!fallbackActive && ws.readyState !== WebSocket.OPEN) {
      fallbackActive = true
      console.log('Fallback polling activated')
      const pollInterval = setInterval(async () => {
        if (ws.readyState === WebSocket.OPEN) {
          clearInterval(pollInterval)
          fallbackActive = false
          console.log('Fallback polling disabled (WebSocket reconnected)')
        } else {
          const data = await poll()
          pollEvents++
        }
      }, 5000)
    }
  }

  ws.onclose = setupFallback
  ws.onerror = setupFallback

  // Simulate WebSocket failure
  await sleep(5000)
  ws.close()

  // Wait for fallback activation
  await sleep(2000)

  // Verify fallback is working
  const initialPollEvents = pollEvents
  await sleep(10000)

  if (pollEvents === initialPollEvents) {
    console.error('Fallback polling did not activate')
    return false
  }

  console.log(`WebSocket events: ${wsEvents}`)
  console.log(`Fallback poll events: ${pollEvents}`)
  return true
}
```

**Expected Results**:
- ✓ WebSocket connects within 5 seconds
- ✓ Polling interval: 5-10 seconds
- ✓ Fallback activates within 2 seconds of disconnect
- ✓ No data loss during fallback

---

### Phase 5: Memory & Performance Validation

**Objective**: Ensure system handles load without memory leaks.

**Procedure**:
```javascript
// 1. Baseline memory measurement
async function measureMemoryBaseline() {
  if (typeof gc === 'function') gc()
  const baseline = process.memoryUsage()

  console.log('Memory baseline:')
  console.log(`  Heap: ${(baseline.heapUsed / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  RSS: ${(baseline.rss / 1024 / 1024).toFixed(2)}MB`)

  return baseline
}

// 2. Run under load
async function runUnderLoad(duration = 300000) {
  const measurements = []
  const interval = setInterval(() => {
    const usage = process.memoryUsage()
    measurements.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      rss: usage.rss
    })
  }, 5000) // Every 5 seconds

  // Simulate load
  const tasks = []
  for (let i = 0; i < 100; i++) {
    tasks.push(simulateEventProcessing())
  }

  await Promise.all(tasks)
  await sleep(duration)

  clearInterval(interval)
  return measurements
}

// 3. Analyze for leaks
function analyzeLeak(measurements) {
  const start = measurements[0]
  const end = measurements[measurements.length - 1]

  const heapGrowth = end.heapUsed - start.heapUsed
  const rssGrowth = end.rss - start.rss

  const heapGrowthMB = heapGrowth / 1024 / 1024
  const rssGrowthMB = rssGrowth / 1024 / 1024

  console.log('Memory growth:')
  console.log(`  Heap: ${heapGrowthMB.toFixed(2)}MB`)
  console.log(`  RSS: ${rssGrowthMB.toFixed(2)}MB`)

  // Linear regression to detect trend
  const times = measurements.map((m, i) => i)
  const heaps = measurements.map(m => m.heapUsed)

  const trend = calculateLinearTrend(times, heaps)
  const growthRate = trend.slope / measurements[0].heapUsed / (300000/1000) // % per second

  console.log(`  Growth rate: ${(growthRate * 100).toFixed(3)}% per second`)

  if (growthRate > 0.01) { // > 1% per second = leak
    console.warn('Potential memory leak detected')
    return false
  }

  return true
}

// 4. Full validation
async function validateMemory() {
  console.log('=== Memory Validation ===')

  const baseline = await measureMemoryBaseline()
  console.log('\n=== Running under load (5 minutes) ===')
  const measurements = await runUnderLoad(300000)
  console.log(`\n=== Analysis ===`)
  const healthy = analyzeLeak(measurements)

  if (healthy) {
    console.log('✓ Memory usage healthy')
  } else {
    console.error('✗ Memory leak detected')
  }

  return healthy
}
```

**Expected Results**:
- ✓ Growth rate < 1% per second
- ✓ No memory peaks exceed 50% of available
- ✓ GC runs regularly and recovers memory

---

## Automated Validation Script

Use this comprehensive validation script:

```javascript
async function fullBlockchainValidation() {
  const results = {
    blockSpeed: await validateBlockSpeed(),
    rpcLimit: await validateRpcLimit(),
    timestamps: await validateBlockTimestamps(),
    priceValid: await validatePriceFeed(),
    swapFlow: await validateFullSwapFlow(tokenIn, tokenOut, amount),
    websocket: await validateWebSocketConnection(),
    fallback: await validateFallbackRecovery(),
    memory: await validateMemory()
  }

  const allPass = Object.values(results).every(r => r.valid !== false)

  console.log('\n=== Validation Summary ===')
  console.table(results)

  if (allPass) {
    console.log('✅ ALL VALIDATIONS PASSED - SAFE TO DEPLOY')
  } else {
    console.error('❌ VALIDATION FAILED - DO NOT DEPLOY')
    process.exit(1)
  }
}

// Run with: node validate.js
fullBlockchainValidation().catch(console.error)
```

---

## Deployment Approval Checklist

Before approving deployment:

- [ ] Block speed verified and documented
- [ ] RPC provider limits confirmed
- [ ] Price feed freshness < 5 seconds
- [ ] Token approval and swap tested on target chain
- [ ] WebSocket connection stability verified
- [ ] Fallback polling works when WebSocket fails
- [ ] Memory usage stable (no leaks detected)
- [ ] Full 5-minute load test completed
- [ ] All confirmations within expected timeframes
- [ ] Disaster recovery (backup/restore) tested

**Do NOT deploy without completing all checks.**
