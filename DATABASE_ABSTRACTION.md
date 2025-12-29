# Database Abstraction Layer

This document describes the database abstraction that hides sql.js implementation details from systems and provides a clean, consistent API.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Systems / Services                                  │
│  (no direct sql.js access)                          │
└──────────────┬──────────────────────────────────────┘
               │ uses DatabaseService
┌──────────────▼──────────────────────────────────────┐
│  DatabaseService                                     │
│  - High-level operations (find, insert, update)     │
│  - Transaction management                           │
│  - Health checks and metrics                        │
└──────────────┬──────────────────────────────────────┘
               │ delegates to DatabaseAdapter
┌──────────────▼──────────────────────────────────────┐
│  DatabaseAdapter                                     │
│  - Query building                                   │
│  - Condition handling                               │
│  - Batch operations                                 │
└──────────────┬──────────────────────────────────────┘
               │ uses underlying database
┌──────────────▼──────────────────────────────────────┐
│  sql.js Database (hidden behind adapter)            │
│  - Prepared statements                              │
│  - Raw SQL execution                                │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. DatabaseAdapter
Low-level abstraction over sql.js. Handles query building and condition formatting.

**Location**: `src/server/db/DatabaseAdapter.js`

**Methods**:
- `find(tableName, conditions)` - Find all matching records
- `findOne(tableName, conditions)` - Find first matching record
- `findById(tableName, id)` - Find by primary key
- `insert(tableName, data)` - Insert single record
- `insertMany(tableName, records)` - Insert multiple records
- `update(tableName, data, conditions)` - Update matching records
- `updateById(tableName, id, data)` - Update by primary key
- `delete(tableName, conditions)` - Delete matching records
- `deleteById(tableName, id)` - Delete by primary key
- `deleteMany(tableName, ids)` - Delete multiple by IDs
- `count(tableName, conditions)` - Count matching records
- `exists(tableName, conditions)` - Check if records exist
- `transaction(callback)` - Execute in transaction
- `batchInsert(tableName, records)` - Atomic batch insert
- `clear(tableName)` - Delete all records

**Example**:
```javascript
import { DatabaseAdapter } from 'src/server/db/DatabaseAdapter.js'

const adapter = new DatabaseAdapter(database)

// Find users with role='admin'
const admins = await adapter.find('users', { role: 'admin' })

// Update specific user
await adapter.updateById('users', userId, { lastLogin: Date.now() })

// Delete expired sessions
await adapter.delete('sessions', { expiresAt: { '<': Date.now() } })

// Transaction
await adapter.transaction(async (adapter) => {
  await adapter.insert('logs', { action: 'user_created', userId })
  await adapter.updateById('users', userId, { status: 'active' })
})
```

### 2. DatabaseService
High-level service for systems. Wraps DatabaseAdapter with health checks and metrics.

**Location**: `src/server/db/DatabaseService.js`

**Methods**:
- All DatabaseAdapter methods
- `query(sql)` - Raw SQL query (use sparingly)
- `getSchema()` - Access schema manager
- `getMetrics()` - Get query metrics
- `getCacheStats()` - Get cache statistics
- `getHealth()` - Health check info

**Example**:
```javascript
import { DatabaseFactory } from 'src/server/db/DatabaseFactory.js'

class UserSystem {
  constructor() {
    this.db = await DatabaseFactory.getSharedService()
  }

  async getUser(userId) {
    return this.db.findById('users', userId)
  }

  async createUser(userData) {
    return this.db.insert('users', userData)
  }

  async updateUser(userId, updates) {
    return this.db.updateById('users', userId, updates)
  }

  async deleteUser(userId) {
    return this.db.deleteById('users', userId)
  }

  async getActiveUsers() {
    return this.db.find('users', { status: 'active' })
  }

  getHealth() {
    return this.db.getHealth()
  }
}
```

### 3. DatabaseFactory
Factory for creating database instances and services.

**Location**: `src/server/db/DatabaseFactory.js`

**Static Methods**:
- `createDatabase(options)` - Create new database instance
- `createService(database)` - Create service for database
- `initialize(database)` - Initialize schema and settings
- `getSharedService()` - Get singleton service instance
- `getDatabase()` - Get underlying database (internal use)
- `resetShared()` - Reset singleton (testing)

**Example**:
```javascript
import { DatabaseFactory } from 'src/server/db/DatabaseFactory.js'

// Singleton pattern (recommended for most systems)
const db = await DatabaseFactory.getSharedService()

// Multiple databases (advanced)
const db1 = await DatabaseFactory.createDatabase()
const service1 = await DatabaseFactory.createService(db1)
```

## Usage Patterns

### Pattern 1: Find Records
```javascript
// Find all
const allUsers = await db.find('users')

// Find with conditions
const admins = await db.find('users', { role: 'admin', active: true })

// Find one
const user = await db.findOne('users', { email: 'user@example.com' })

// Find by ID
const user = await db.findById('users', userId)
```

### Pattern 2: Create Records
```javascript
// Single insert
await db.insert('users', {
  id: userId,
  email: 'user@example.com',
  role: 'user'
})

// Multiple inserts (atomic)
await db.batchInsert('logs', [
  { action: 'login', userId, timestamp: Date.now() },
  { action: 'action1', userId, timestamp: Date.now() },
  { action: 'action2', userId, timestamp: Date.now() }
])
```

### Pattern 3: Update Records
```javascript
// Update by ID
await db.updateById('users', userId, {
  lastLogin: Date.now(),
  status: 'online'
})

// Update with conditions
await db.update('sessions',
  { active: false },
  { expiresAt: { '<': Date.now() } }
)
```

### Pattern 4: Delete Records
```javascript
// Delete by ID
await db.deleteById('users', userId)

// Delete with conditions
await db.delete('sessions', { expiresAt: { '<': Date.now() } })

// Delete multiple
await db.deleteMany('logs', ['log1', 'log2', 'log3'])

// Delete all (dangerous!)
await db.clear('temp_data')
```

### Pattern 5: Transactions
```javascript
// Atomic operations (all or nothing)
try {
  const result = await db.transaction(async (adapter) => {
    await adapter.insert('users', userData)
    await adapter.insert('user_settings', settingsData)
    return true
  })
} catch (err) {
  // Both operations rolled back
  console.error('Transaction failed:', err)
}
```

### Pattern 6: Queries with Metrics
```javascript
// All queries are automatically tracked
const users = await db.find('users')

// View metrics
const metrics = db.getMetrics()
console.log('Total queries:', metrics.totalQueries)
console.log('Cache hits:', metrics.cacheHits)

// View cache stats
const cacheStats = db.getCacheStats()
console.log('Cached queries:', cacheStats.cachedQueries)

// Health check
const health = db.getHealth()
console.log('Database uptime:', health.uptime)
console.log('Last query:', health.lastQuery, 'ms ago')
```

## Benefits of Abstraction

### 1. SQL.js Hidden
Systems don't know about:
- `prepare()`, `bind()`, `step()`, `getAsObject()`
- Raw statement objects
- SQL.Database internals

### 2. Consistent API
All systems use same interface:
```javascript
// Not this (implementation detail):
// const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
// stmt.bind([userId])
// stmt.step()
// const user = stmt.getAsObject()

// But this (clean API):
const user = await db.findById('users', userId)
```

### 3. Automatic Caching
Queries cached transparently:
```javascript
// First call queries database
const user1 = await db.findById('users', userId)

// Second call hits cache
const user2 = await db.findById('users', userId) // Fast!

// Cache invalidated on write
await db.updateById('users', userId, { name: 'new' })

// Next read queries database again
const user3 = await db.findById('users', userId) // Fresh
```

### 4. Metrics & Monitoring
Track all database operations:
```javascript
const metrics = db.getMetrics()
// {
//   totalQueries: 1250,
//   slowestQuery: 234, // ms
//   averageQueryTime: 5,
//   cacheHits: 892,
//   tableSummary: { users: 450, logs: 500, sessions: 300 }
// }
```

### 5. Health Checks
Monitor database health:
```javascript
const health = db.getHealth()
// {
//   connected: true,
//   uptime: 3600000,
//   lastQuery: 50, // ms ago
//   hasCache: true,
//   cacheStats: { ... },
//   metrics: { ... }
// }
```

### 6. Easy Testing
Replace database in tests:
```javascript
// Create mock adapter for testing
class MockDatabaseService {
  async find(table, conditions) {
    return testData[table] || []
  }
  // ... other methods
}

// Use in test
const mockDb = new MockDatabaseService()
const system = new MySystem(mockDb) // Works!
```

## Migration Guide

### Old (Direct sql.js):
```javascript
export async function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  stmt.bind([userId])
  stmt.step()
  const user = stmt.getAsObject()
  stmt.free()
  return user
}
```

### New (Using abstraction):
```javascript
export async function getUser(userId) {
  return db.findById('users', userId)
}
```

## File Locations

- `src/server/db/DatabaseAdapter.js` - Low-level adapter
- `src/server/db/DatabaseService.js` - High-level service
- `src/server/db/DatabaseFactory.js` - Service factory
- `src/server/db/DatabaseSchema.js` - Schema management
- `src/server/db/QueryBuilder.js` - Query construction
- `src/server/db/CachedQueryBuilder.js` - Cached queries
- `src/server/cache/QueryCache.js` - Query caching
- `src/server/cache/RedisCache.js` - Redis backend

## Performance Considerations

### Caching Strategy
- All SELECT queries cached by default
- Cache invalidated on INSERT/UPDATE/DELETE
- Redis backend optional for multi-process scaling
- In-memory fallback always available

### Query Optimization
- Use conditions to filter at database level
- Avoid full table scans (use findById when possible)
- Batch operations use transactions for atomicity
- Metrics help identify slow queries

### Concurrency
- Transactions ensure consistency
- Multiple readers supported
- Single writer (sql.js limitation)
- Connection pooling in query cache

## Best Practices

1. **Always use conditions**: Filter at database level, not in application
   ```javascript
   // Good
   const admins = await db.find('users', { role: 'admin' })

   // Bad
   const users = await db.find('users')
   const admins = users.filter(u => u.role === 'admin')
   ```

2. **Use transactions for multi-step operations**:
   ```javascript
   // Good
   await db.transaction(async (adapter) => {
     await adapter.insert('logs', event)
     await adapter.updateById('users', userId, { lastAction: Date.now() })
   })
   ```

3. **Monitor metrics regularly**:
   ```javascript
   const metrics = db.getMetrics()
   if (metrics.averageQueryTime > 100) {
     logger.warn('Database queries slowing down')
   }
   ```

4. **Check health on startup**:
   ```javascript
   const health = db.getHealth()
   if (!health.connected) {
     throw new Error('Database not available')
   }
   ```

5. **Never use raw SQL directly**:
   ```javascript
   // Bad - use adapter methods instead
   // await db.query('DELETE FROM users')

   // Good
   await db.clear('users')
   ```

## Troubleshooting

### Slow Queries
```javascript
const metrics = db.getMetrics()
console.log('Slowest query:', metrics.slowestQuery, 'ms')
// Optimize queries or add indexes
```

### Cache Issues
```javascript
const stats = db.getCacheStats()
if (stats.hitRate < 0.5) {
  logger.warn('Low cache hit rate')
}
```

### Health Checks
```javascript
const health = db.getHealth()
console.log('Database status:', health.connected ? 'OK' : 'FAILED')
```
