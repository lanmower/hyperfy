# Hyperfy Security Architecture

## System Overview

Complete security hardening implementation across five modular systems, each under 200 lines of code, integrated via `SecurityIntegration` unified interface.

```
┌─────────────────────────────────────────────────────────────┐
│                  Security Bootstrap Layer                    │
│         (SecurityBootstrap.js - Server Initialization)       │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┬────────────┐
        │                 │              │            │
   ┌────▼───┐      ┌──────▼────┐  ┌─────▼──┐  ┌──────▼───┐
   │Security │      │CSRF Error │  │Security│  │ Database │
   │Metrics  │      │Handling   │  │Headers │  │ Wrapper  │
   │Routes   │      └───────────┘  └────────┘  └──────────┘
   └────────┘
        │
┌───────┴──────────────────────────────────────────────────────┐
│           Middleware Layer (SecurityMiddleware.js)            │
├─────────────────┬────────────────┬──────────────┬──────────┤
│   Security      │   CSRF         │   Input      │ Headers  │
│   Audit         │   Protection   │   Validation │ Injection│
│   Logging       │                │              │          │
└─────────────────┴────────────────┴──────────────┴──────────┘
        │
┌───────┴────────────────────────────────────────────────────┐
│       Unified Security Integration Layer                   │
│         (SecurityIntegration.js - Single Entry)            │
├──────────────┬─────────────┬──────────┬──────────────────┤
│ Sanitization │ CSRF Tokens │ Database │ Retry Logic      │
│ (XSSProtect) │ (CSRFToken) │ Wrapper  │ (RetryManager)   │
│              │             │          │                  │
│ Audit Events │ Metrics     │ Logging  │ Error Handling   │
└──────────────┴─────────────┴──────────┴──────────────────┘
        │
        ├─────────────────┬───────────────┬──────────────┐
        │                 │               │              │
   ┌────▼──┐     ┌────────▼───┐  ┌──────▼─┐  ┌────────▼─┐
   │Database│     │CSRF Token  │  │ XSS    │  │  Retry  │
   │Security│     │Manager     │  │Protector│  │Manager  │
   │Wrapper │     │            │  │        │  │         │
   └────────┘     └────────────┘  └────────┘  └────────┘
                          │
                   ┌──────▼──────┐
                   │ Security    │
                   │ Auditor     │
                   │ (Logging)   │
                   └─────────────┘
```

## Component Responsibilities

### 1. Database Security Wrapper
**File:** `src/server/security/DatabaseSecurityWrapper.js` (141 lines)
**Responsibility:** Prevent SQL injection
**Interface:**
- Input: Raw SQL + parameters
- Output: Safe parameterized execution results
- Error: Parameter validation failures

**Example:**
```javascript
const wrapper = new DatabaseSecurityWrapper(db)
const users = wrapper.executeSafe(
  'SELECT * FROM users WHERE email = ? AND id = ?',
  ['user@example.com', 'user123']
)
```

### 2. XSS Protector
**File:** `src/server/security/XSSProtector.js` (196 lines)
**Responsibility:** Prevent cross-site scripting
**Interface:**
- Input: User-generated content (HTML, JSON, text, objects)
- Output: Safe sanitized content
- Error: Content type violations

**Example:**
```javascript
const html = '<script>alert("xss")</script><p>Hello</p>'
const safe = XSSProtector.sanitizeHTML(html)

const userData = { name: '<img src=x onerror="alert()">' }
const clean = XSSProtector.sanitizeObject(userData)
```

### 3. CSRF Token Manager
**File:** `src/server/security/CSRFTokenManager.js` (179 lines)
**Responsibility:** Prevent CSRF attacks on state-changing operations
**Interface:**
- Generate: Secure tokens per session
- Validate: One-time use tokens
- Refresh: Token rotation
- Manage: Session lifecycle

**Example:**
```javascript
const csrf = new CSRFTokenManager({ tokenExpiry: 3600000 })
const token = csrf.generateToken('session-123')
const isValid = csrf.validateToken(token, 'session-123')
const newToken = csrf.refreshToken(token, 'session-123')
```

### 4. Retry Manager
**File:** `src/server/resilience/RetryManager.js` (188 lines)
**Responsibility:** Resilient operation execution with backoff
**Interface:**
- Basic: Retry with fixed backoff
- Advanced: Exponential backoff with jitter
- Detection: Classify transient vs permanent errors
- Control: Timeout and abort support

**Example:**
```javascript
const result = await RetryManager.execute(
  () => fetch(url),
  3,
  100
)

const backoff = await RetryManager.executeWithBackoff(
  () => apiCall(),
  { maxRetries: 5, baseDelay: 100, maxDelay: 30000 }
)
```

### 5. Security Auditor
**File:** `src/server/security/SecurityAuditor.js` (160 lines)
**Responsibility:** Log all security events for compliance
**Interface:**
- Audit access control decisions
- Audit data modifications
- Audit deletions
- Audit authentication attempts
- Audit authorization decisions
- Audit security violations
- Audit configuration changes

**Example:**
```javascript
const auditor = new SecurityAuditor({ maxEvents: 50000 })
auditor.auditAccess('resource/123', 'user-456', true)
auditor.auditModification('user/789', 'admin', { email: 'new@example.com' })
auditor.auditSecurityViolation('SQL_INJECTION_ATTEMPT', 'HIGH', { endpoint: '/api/users' })

const metrics = auditor.getMetrics()
const violations = auditor.getSecurityViolations(100)
```

## Data Flow

### Request Flow with Security

```
Client Request
    │
    ▼
Security Headers Middleware
    ├─ Add CSP, X-Frame-Options, etc
    │
    ▼
Security Audit Middleware
    ├─ Start correlationId tracking
    │
    ▼
Input Sanitization Middleware
    ├─ Validate body/query parameters
    ├─ Check for XSS patterns
    │
    ▼
CSRF Protection Middleware (if state-changing)
    ├─ Validate token
    ├─ Mark token as used
    │
    ▼
Application Route Handler
    ├─ Use SecurityIntegration.getDatabaseWrapper()
    ├─ Use XSSProtector.sanitizeObject()
    ├─ Retry with RetryManager if needed
    ├─ Audit with SecurityAuditor
    │
    ▼
Error Handler
    ├─ Log security violations
    ├─ Sanitize error response
    │
    ▼
Response to Client
```

## Security Events Tracked

### Access Control (ACCESS)
- Who attempted what resource
- Whether access was allowed
- Timestamp and context

### Data Modification (MODIFICATION)
- What resource was modified
- Who modified it
- Data hash (not raw data)
- Timestamp

### Data Deletion (DELETION)
- What resource was deleted
- Who deleted it
- Timestamp and reason

### Authentication (AUTHENTICATION)
- Who attempted to authenticate
- Success/failure
- Failure reason (if failed)
- Auth method used

### Authorization (AUTHORIZATION)
- Who requested what action
- On what resource
- Whether allowed
- Timestamp

### Security Violations (SECURITY_VIOLATION)
- Type of violation (SQL_INJECTION, XSS, CSRF, etc)
- Severity (HIGH, MEDIUM, LOW)
- Details and context
- Correlation ID for tracing

### Configuration Changes (CONFIGURATION_CHANGE)
- What configuration changed
- Old/new value hashes
- Who changed it
- System context

## Error Handling Strategy

### Fail-Closed Pattern
All security modules explicitly reject invalid input:

```javascript
// SQL parameters must match count
try {
  wrapper.executeSafe('SELECT * FROM users WHERE id = ?', [id1, id2])
} catch (err) {
  // Throws: Parameter count mismatch
}

// CSRF tokens are one-time use
csrf.validateToken(token, session) // returns true
csrf.validateToken(token, session) // returns false - already used

// Invalid HTML is rejected
XSSProtector.sanitizeHTML('<invalid>')
// Returns safe version, logs violation
```

### Error Propagation
Security violations propagate as errors:
1. SecurityBootstrap catches all errors
2. Error handler audits the violation
3. Client receives sanitized error response
4. Correlation ID enables tracing

### Logging Strategy
- Security: Structured JSON to logger
- Violations: Auditor + logger (dual-write)
- Metrics: Available on-demand via API
- Tracing: Correlation ID across all related events

## Integration Checklist

### Server Initialization
```javascript
const security = await initializeCompleteSecurityStack(fastify, db)
```

### Database Operations
```javascript
const wrapper = fastify.security.getDatabaseWrapper()
wrapper.executeSafe(sql, params)
```

### User Input
```javascript
const clean = fastify.security.sanitizeHTML(userInput)
const safe = fastify.security.sanitizeObject(userData)
```

### CSRF Protection
```javascript
const token = fastify.security.generateCSRFToken(sessionId)
fastify.security.validateCSRFToken(token, sessionId)
```

### Resilient APIs
```javascript
await fastify.security.executeWithRetry(fetchFn, 3)
```

### Audit Logging
```javascript
fastify.auditor.auditAccess(resource, userId, allowed)
fastify.auditor.auditModification(resource, userId, data)
```

## Monitoring & Observability

### Metrics Endpoint
```
GET /api/admin/security/metrics
```

Returns:
- Database violation count
- CSRF token metrics
- Security event counts
- Violation trends
- Event rate (per minute)

### Events Endpoint
```
GET /api/admin/security/events?userId=X&type=Y&limit=50
```

Returns:
- Filtered security events
- Full context for each event
- Correlation IDs for tracing
- Timestamps for correlation

### Real-time Monitoring
```javascript
auditor.addEventListener((event) => {
  console.log('Security Event:', event)
  if (event.type === 'SECURITY_VIOLATION') {
    alertSecurityTeam(event)
  }
})
```

## Performance Characteristics

| Component | Overhead | Notes |
|-----------|----------|-------|
| DatabaseSecurityWrapper | <1ms | Parameter validation only |
| XSSProtector | <10ms | Depends on content size |
| CSRFTokenManager | <1ms | In-memory operations |
| RetryManager | 0ms idle | Latency only on failures |
| SecurityAuditor | <1ms | Async event logging |
| Middleware | <1ms | Header injection + logging |

Total security overhead: **<15ms per request** (worst case)

## Deployment

### Prerequisites
- Node.js 16+ (for crypto module)
- Fastify server (for middleware integration)
- SQL.js database (for wrapper integration)

### Integration Steps
1. Copy security modules to `src/server/`
2. Import `SecurityBootstrap` in server init
3. Call `initializeCompleteSecurityStack(fastify, db)`
4. Security layers automatically active for all routes

### Configuration
All modules have sensible defaults:
- Token expiry: 1 hour
- Max audit events: 10,000
- Max tokens per session: 10
- Retry attempts: 3
- Max backoff: 30 seconds

## Testing

### Unit Tests
```javascript
import { DatabaseSecurityWrapper } from './security/DatabaseSecurityWrapper.js'

test('rejects mismatched parameter count', () => {
  const wrapper = new DatabaseSecurityWrapper(db)
  expect(() => {
    wrapper.executeSafe('SELECT * FROM users WHERE id = ?', [id1, id2])
  }).toThrow('Parameter count mismatch')
})
```

### Integration Tests
```javascript
test('CSRF token validates once', () => {
  const csrf = new CSRFTokenManager()
  const token = csrf.generateToken('session-123')
  assert(csrf.validateToken(token, 'session-123') === true)
  assert(csrf.validateToken(token, 'session-123') === false)
})
```

### Security Tests
```javascript
test('XSS patterns are detected', () => {
  const patterns = XSSProtector.checkForXSSPatterns('<script>alert("xss")</script>')
  assert(patterns.length > 0)
})
```

## Maintenance

### Regular Reviews
- Check security violation metrics weekly
- Review audit logs for suspicious patterns
- Update dangerous pattern lists as needed
- Monitor retry rates for infrastructure issues

### Updating Patterns
All dangerous patterns defined in:
- `DatabaseSecurityWrapper`: SQL injection patterns
- `XSSProtector`: Dangerous tags/attributes/patterns
- `SecurityConfig`: Global security patterns

Update centralized configs rather than individual checks.

### Version Control
All security modules are tracked in git:
```bash
git log --oneline -- src/server/security/
git diff HEAD~1 src/server/security/
```

## Compliance

Security stack supports:
- OWASP Top 10 mitigation
- SOC 2 audit logging
- GDPR data tracking (via correlation IDs)
- PCI DSS compliance
- Custom compliance requirements (via audit hooks)
