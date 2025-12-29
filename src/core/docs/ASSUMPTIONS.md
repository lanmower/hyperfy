# Critical Assumptions: Blockchain & Network Behavior

This document catalogs all assumptions about blockchain and network behavior that are critical to system reliability. **NEVER assume these without testing in the target environment.**

## Blockchain Architecture Assumptions

### 1. Block Timestamp Calculations

**Assumption**: Use `getBlock(timestamp)` for time differences, NOT block count.

**Why Critical**: Different blockchains have different block production rates:
- Ethereum: ~12 seconds per block (5 blocks per minute)
- Polygon: ~2-3 seconds per block (20-30 blocks per minute)
- Fast networks: 100+ blocks per minute or higher
- Custom chains: Highly variable

**Wrong Pattern**:
```javascript
// WRONG: Block count != time on all chains
const timeDiff = (endBlockNumber - startBlockNumber) * 12000
```

**Correct Pattern**:
```javascript
// CORRECT: Use block timestamps directly
const startBlock = await getBlock(startTimestamp)
const endBlock = await getBlock(endTimestamp)
const timeDiff = endBlock.timestamp - startBlock.timestamp
```

**Testing Requirement**: Must verify actual block speed in target chain:
```javascript
const block1 = await getBlock()
await sleep(1000)
const block2 = await getBlock()
const blockTime = (block2.number - block1.number) / 1 // blocks per second
```

---

### 2. Fast Blockchains: Multiple Blocks Per Second

**Assumption**: Modern blockchains produce multiple blocks per second, not one per minute.

**Examples**:
- Solana: 400+ blocks/second
- Avalanche: 2+ blocks/second
- Polygon: 20-30 blocks/second
- BSC: 3-5 blocks/second

**Impact on Code**:
- Block-based rate limiting will be insufficient (need time-based limits)
- Event polling needs to handle large block gaps (chunking required)
- Historical data queries may need pagination
- Consecutive blocks arrive in microseconds, not minutes

**Implementation Pattern**:
```javascript
// Use time-based windows, not block counts
const window = 60000 // 1 minute in milliseconds
const startTime = Date.now() - window
const startBlock = await getBlockByTimestamp(startTime)

// Chunk large gaps for RPC compatibility
const endBlock = latestBlock
const chunkSize = 1000
const blockGap = endBlock - startBlock
const chunks = Math.ceil(blockGap / chunkSize)
```

---

### 3. Price Data Freshness Requirements

**Assumption**: Real-time market data requires direct database access, NOT secondary caches.

**Why Critical**:
- Price feeds can become stale quickly
- Secondary caches may lag by seconds or minutes
- Trading decisions based on stale prices cause financial loss
- Single source of truth prevents dual-system inconsistencies

**Wrong Pattern**:
```javascript
// WRONG: Secondary cache may be stale
const price = priceCache.get(tokenAddress)
```

**Correct Pattern**:
```javascript
// CORRECT: Direct database or real-time feed
const price = await priceDatabase.getLatestPrice(tokenAddress)
// Verify freshness
if (Date.now() - price.timestamp > 5000) {
  throw new Error('Price data too stale')
}
```

**Implementation**:
- Use event-driven updates (WebSocket from price feed)
- Implement fallback polling if event stream fails
- Store prices with timestamp, validate freshness before use
- Never trust cache without timestamp validation

---

### 4. Event-Driven Systems with Fallback Polling

**Assumption**: WebSocket + fallback polling provides reliability without redundant detection.

**Architecture**:
```
Primary: WebSocket (real-time events)
  ↓ (if disconnected)
Fallback: Polling (every N seconds)
  ↓ (if both fail)
Circuit breaker opens
```

**Critical**: Ensure detection → persistence → consumption chain is complete:

1. **Detection**: Event fired or polling interval triggers
2. **Persistence**: Result written to shared cache immediately (same transaction)
3. **Consumption**: Multiple systems read from cache, never from detection event directly

**Wrong Pattern**:
```javascript
// WRONG: Dual detection creates race conditions
if (eventDetected) { recordResult() }
else if (pollDetected) { recordResult() } // May record same thing twice
```

**Correct Pattern**:
```javascript
// CORRECT: Single source of truth
async function onDetection(result) {
  // 1. Persist immediately
  await cache.set(key, result)

  // 2. Notify all consumers
  eventEmitter.emit('detection-complete', result)
}

// WebSocket handler
ws.on('event', onDetection)

// Polling fallback (disabled if WebSocket works)
if (!wsConnected) {
  setInterval(() => {
    const polled = poll()
    if (polled && !cache.has(key)) {
      onDetection(polled)
    }
  }, 30000)
}
```

---

### 5. RPC Provider Limitations

**Assumption**: RPC providers limit query results (typically 1000 blocks per call).

**Known Limits**:
- Ethereum (Infura): 1000 blocks per `getLogs()`
- Polygon (Matic RPC): 1000 blocks per query
- Custom providers: May be more or less restrictive

**Implementation**:
```javascript
// WRONG: Single call for large range
const events = await provider.getLogs({
  fromBlock: 0,
  toBlock: 'latest' // Will fail if > 1000 blocks
})

// CORRECT: Chunked with error handling
async function getLogsChunked(fromBlock, toBlock, chunkSize = 1000) {
  const results = []
  for (let i = fromBlock; i <= toBlock; i += chunkSize) {
    const to = Math.min(i + chunkSize - 1, toBlock)
    try {
      const chunk = await provider.getLogs({
        fromBlock: i,
        toBlock: to,
        address: targetAddress,
        topics: [eventSignature]
      })
      results.push(...chunk)
    } catch (error) {
      if (error.message.includes('1000')) {
        // RPC limit hit, reduce chunk size
        return getLogsChunked(fromBlock, toBlock, chunkSize / 2)
      }
      throw error
    }
  }
  return results
}
```

---

### 6. Emergency Sync Patterns for Large Block Gaps

**Assumption**: When offline for extended periods, bulk sync is required with dual token fetching.

**Scenario**: System offline for hours, blockchain has thousands of new blocks.

**Pattern**:
```javascript
async function emergencySync(lastSyncBlock, currentBlock) {
  const gap = currentBlock - lastSyncBlock

  if (gap > 10000) {
    // Large gap: Use bulk operations

    // 1. Fetch in chunks (handle RPC limits)
    const chunkSize = 1000
    const events = []
    for (let i = lastSyncBlock; i <= currentBlock; i += chunkSize) {
      const chunk = await getLogsChunked(i, Math.min(i + chunkSize - 1, currentBlock))
      events.push(...chunk)
    }

    // 2. Dual token fetching for completeness
    const tokenA = await fetchTokenData('0xA...') // Token 0
    const tokenB = await fetchTokenData('0xB...') // Token 1

    // 3. Batch database insert (single transaction)
    await db.transaction(async (trx) => {
      for (const event of events) {
        await trx('events').insert(event)
      }
    })

    return { synced: events.length, tokens: [tokenA, tokenB] }
  }
}
```

---

### 7. Token Approval Flow for ERC20 Swaps

**Assumption**: Tokens require explicit approval before swapping in ERC20 contracts.

**Required Sequence**:
```
1. Check current allowance: allowance(owner, spender)
2. If allowance < amount: approve(spender, amount)
3. Wait for approval confirmation
4. Execute: swapExactTokensForTokens(amountIn, minAmountOut, path, to, deadline)
```

**Implementation**:
```javascript
async function executeSwap(tokenIn, tokenOut, amountIn) {
  const router = '0xRouter...'
  const [signer] = await ethers.getSigners()
  const owner = await signer.getAddress()

  // 1. Check approval
  const currentAllowance = await tokenIn.allowance(owner, router)

  if (currentAllowance.lt(amountIn)) {
    // 2. Request approval
    const approveTx = await tokenIn.approve(router, amountIn)
    const approveReceipt = await approveTx.wait(2) // Wait for 2 confirmations

    if (approveReceipt.status !== 1) {
      throw new Error('Approval failed')
    }
  }

  // 3. Wait for approval to be confirmed on-chain
  await ethers.provider.waitForTransaction(approveTx.hash, 2)

  // 4. Execute swap
  const swapTx = await swapRouter.swapExactTokensForTokens(
    amountIn,
    minimumAmountOut,
    [tokenIn.address, tokenOut.address],
    owner,
    Math.floor(Date.now() / 1000) + 60 // 60 second deadline
  )

  return swapTx
}
```

---

### 8. Manual Testing Requirements

**Assumption**: All trading functionality MUST be tested with real swaps before deployment.

**Why Not Simulation**:
- Simulations don't catch on-chain state issues
- Price slippage varies in production
- Contract behavior differs from test environment
- Gas calculations are estimates, not exact

**Testing Checklist**:
```
Before Deployment:
☐ Execute test swap with real tokens (small amount)
☐ Verify token approval process works
☐ Confirm price feed accuracy within 1%
☐ Test fallback polling if WebSocket fails
☐ Verify RPC chunking with actual block gaps
☐ Test emergency sync on target chain
☐ Validate database persistence after recovery
☐ Check memory usage during extended polling
☐ Test rate limiting under load
```

---

### 9. Blockchain Data Freshness Windows

**Assumption**: Different data types have different freshness requirements.

**Data Freshness Tiers**:
- **Critical (< 1 second)**: Current token prices, balance checks
- **Important (< 5 seconds)**: Recent transactions, pending swaps
- **Standard (< 30 seconds)**: Historical event logs, statistics
- **Acceptable (< 5 minutes)**: Config data, static blockchain data

**Implementation**:
```javascript
const FRESHNESS_REQUIREMENTS = {
  'price_feed': { maxAgeMs: 1000 },
  'balance': { maxAgeMs: 500 },
  'pending_tx': { maxAgeMs: 5000 },
  'event_logs': { maxAgeMs: 30000 },
  'config': { maxAgeMs: 300000 }
}

function validateFreshness(data, type) {
  const requirement = FRESHNESS_REQUIREMENTS[type]
  const age = Date.now() - data.timestamp
  if (age > requirement.maxAgeMs) {
    throw new Error(`Data too stale: ${age}ms > ${requirement.maxAgeMs}ms`)
  }
}
```

---

### 10. Block Reorganization Handling

**Assumption**: Blockchains can reorg (blocks are reorganized), requiring retry logic.

**Why Critical**:
- Ethereum: Occasional 1-2 block reorgs
- Fast chains: More frequent reorgs
- User-facing operations may be affected

**Pattern**:
```javascript
async function executeWithReorgProtection(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn()
      // Wait for confirmations before considering final
      const receipt = await provider.waitForTransaction(result.hash, 6)
      return result
    } catch (error) {
      if (error.message.includes('reorg') || error.message.includes('replaced')) {
        if (attempt < maxRetries - 1) {
          await sleep(1000 * (attempt + 1)) // Exponential backoff
          continue
        }
      }
      throw error
    }
  }
}
```

---

## Network Behavior Assumptions

### 1. WebSocket Connection Reliability

**Assumption**: WebSocket connections are NOT guaranteed to stay open indefinitely.

**Expected Behavior**:
- Connections drop after periods of inactivity
- Network changes (WiFi → 4G) cause disconnection
- Server timeouts after N minutes of no messages
- Browser closes inactive connections

**Implementation**:
```javascript
// Implement heartbeat to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }))
  }
}, 30000) // Every 30 seconds

// Implement reconnection on close
ws.onclose = () => {
  const reconnectDelay = Math.min(backoff * 2, 30000)
  setTimeout(() => {
    ws = new WebSocket(url)
  }, reconnectDelay)
}
```

### 2. Network Latency Variability

**Assumption**: Network latency varies significantly and must be accounted for.

**Observed Ranges**:
- Local/same region: 1-10ms
- Cross-country: 50-100ms
- Intercontinental: 100-500ms+
- Mobile: 20-200ms (highly variable)

**Implementation**:
```javascript
const TIMEOUT_WINDOWS = {
  'local': 5000,      // 5 second timeout
  'regional': 10000,  // 10 second timeout
  'global': 30000,    // 30 second timeout
  'mobile': 45000     // 45 second timeout
}

// Detect latency and adjust timeouts dynamically
function getAppropriateTimeout(measuredLatency) {
  if (measuredLatency < 20) return TIMEOUT_WINDOWS.local
  if (measuredLatency < 100) return TIMEOUT_WINDOWS.regional
  if (measuredLatency < 500) return TIMEOUT_WINDOWS.global
  return TIMEOUT_WINDOWS.mobile
}
```

---

## Validation Testing

This document's assumptions are validated through:

1. **Unit Tests**: Verify logic handles edge cases
2. **Integration Tests**: Confirm blockchain interaction patterns
3. **Manual Testing**: Execute real transactions on target chain
4. **Load Testing**: Verify behavior under stress
5. **Chaos Testing**: Inject failures (network drops, block reorgs)

**Never Deploy Without**:
- ✅ Manual swap test on target chain
- ✅ Event-driven system reliability confirmed
- ✅ RPC chunking tested with actual block gaps
- ✅ Fallback polling verified working
- ✅ Memory usage validated under load
- ✅ Recovery system tested with actual backups
