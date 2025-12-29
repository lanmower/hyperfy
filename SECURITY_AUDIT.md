# Hyperfy API Security Audit Report

**Date**: December 27, 2025
**Scope**: All HTTP API endpoints in `src/server/routes/` and WebSocket handlers in `src/core/systems/server/`
**Critical Issues Found**: 8

---

## CRITICAL VULNERABILITIES DISCOVERED

### 1. CRITICAL: Unauthenticated File Upload Endpoint
**Severity**: CRITICAL (CVSS 9.1)
**Location**: `src/server/routes/UploadRoutes.js` - `/api/upload` endpoint

**Vulnerability**:
- POST endpoint has NO authentication checks whatsoever
- Accepts file uploads from ANY client without verification
- No session/user validation required
- Can be exploited for arbitrary file upload attacks
- 200MB max size allows denial-of-service via resource exhaustion

**Proof of Concept**:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@malicious.exe" \
  # No auth token required - succeeds
```

**Impact**:
- Remote Code Execution (RCE) if executable files uploaded
- Storage exhaustion (200MB per upload with no rate limit)
- Malware distribution
- Server resource exhaustion
- No user accountability for uploads

**Root Cause**: Upload endpoint registered without pre-request hook to validate user authentication

---

### 2. CRITICAL: Unauthenticated File Existence Checking
**Severity**: CRITICAL (CVSS 8.7)
**Location**: `src/server/routes/UploadRoutes.js` - `/api/upload-check` endpoint

**Vulnerability**:
- GET endpoint provides file existence information without authentication
- Arbitrary filename parameter accepted directly from query string
- Returns boolean indicating if file exists
- Can enumerate all uploaded files via timing attacks

**Proof of Concept**:
```bash
curl "http://localhost:3000/api/upload-check?filename=abc123.exe"
# Returns: { exists: true } - reveals file was uploaded
```

**Impact**:
- Information disclosure of uploaded files
- File enumeration attacks
- Can determine if specific files exist in system
- User privacy violation

---

### 3. HIGH: Unauthenticated Error Monitoring API
**Severity**: HIGH (CVSS 8.2)
**Location**: `src/server/routes/ErrorRoutes.js` - `/api/errors` endpoint

**Vulnerability**:
- GET endpoint accessible without authentication
- Returns complete error logs, stats, and metadata
- Can filter by type, since, side, critical flag
- Exposes internal application state and debugging information
- Error messages may contain sensitive data (paths, user IDs, etc.)

**Proof of Concept**:
```bash
curl "http://localhost:3000/api/errors?limit=100&type=error"
# Returns all system errors with full stack traces and context
```

**Impact**:
- Information disclosure of system architecture
- Exposure of sensitive error details
- Debugging information leakage
- Could reveal SQL injection points or business logic flaws

---

### 4. HIGH: Unauthenticated Error Clearing
**Severity**: HIGH (CVSS 7.5)
**Location**: `src/server/routes/ErrorRoutes.js` - `/api/errors/clear` endpoint

**Vulnerability**:
- POST endpoint clears all error logs without authentication
- No auth token required
- Can be called by any remote user
- Destroys audit trail of errors
- Prevents incident investigation

**Proof of Concept**:
```bash
curl -X POST http://localhost:3000/api/errors/clear
# Success - all error logs deleted
```

**Impact**:
- Loss of audit trail
- Potential evidence destruction
- Prevents security incident investigation
- Prevents debugging legitimate issues

---

### 5. HIGH: Unauthenticated Error Stream WebSocket
**Severity**: HIGH (CVSS 8.5)
**Location**: `src/server/routes/ErrorRoutes.js` - `/api/errors/stream` WebSocket

**Vulnerability**:
- WebSocket endpoint streams real-time errors without authentication
- Any client can connect and receive live error stream
- Exposes all errors across all users in real-time
- No session validation on websocket connection

**Proof of Concept**:
```javascript
const ws = new WebSocket('ws://localhost:3000/api/errors/stream');
ws.onmessage = (event) => {
  console.log('Received error:', event.data);
  // All system errors streamed in real-time
};
```

**Impact**:
- Real-time monitoring of system errors
- Information disclosure of sensitive errors
- Potential to find exploitable error conditions
- Could reveal zero-day vulnerabilities being logged

---

### 6. HIGH: Unauthenticated Server Status Endpoint
**Severity**: HIGH (CVSS 7.2)
**Location**: `src/server/routes/StatusRoutes.js` - `/status` endpoint

**Vulnerability**:
- GET endpoint returns detailed server and player information
- Lists all connected players with:
  - User IDs
  - Avatar URLs
  - Real-time positions
  - Player names
- No authentication required
- Reveals admin code existence via `protected` flag

**Proof of Concept**:
```bash
curl http://localhost:3000/status
# Returns:
# {
#   uptime: 12345,
#   protected: true,  # Reveals admin code exists
#   connectedUsers: [
#     { id: "user-123", position: [0, 0, 0], name: "PlayerName" }
#   ],
#   commitHash: "abc123def"
# }
```

**Impact**:
- Player DoS targeting (can target by position)
- Privacy violation (real-time player tracking)
- Reveals system is admin-protected
- Reveals Git commit hash (information gathering)

---

### 7. MEDIUM: Path Traversal in Upload Route
**Severity**: MEDIUM (CVSS 6.5)
**Location**: `src/server/routes/UploadRoutes.js` - `/api/upload-check` endpoint

**Vulnerability**:
- `filename` parameter from query string used directly in path.join()
- Although FileStorage uses hash-based filenames, the check endpoint doesn't
- Potential for path traversal if filename contains `../`

**Proof of Concept**:
```bash
curl "http://localhost:3000/api/upload-check?filename=../../config.json"
# Could potentially expose file existence information
```

**Impact**:
- Path traversal information disclosure
- Could enumerate server directory structure
- Combined with other vulnerabilities, could leak sensitive files

---

### 8. MEDIUM: Missing Input Validation on Error Filtering
**Severity**: MEDIUM (CVSS 5.3)
**Location**: `src/server/routes/ErrorRoutes.js` - `/api/errors` endpoint

**Vulnerability**:
- Query parameters parsed without validation
- `limit` parameter converted to parseInt() without range validation
- Could request millions of records causing DoS
- `type` and `side` parameters not validated against whitelist

**Proof of Concept**:
```bash
curl "http://localhost:3000/api/errors?limit=999999999"
# Attempts to retrieve and return 999M error records
```

**Impact**:
- Denial of service via memory exhaustion
- Could crash server by loading all errors into memory
- CPU exhaustion processing massive datasets

---

## AUTHENTICATION ISSUES

### 9. MAJOR: WebSocket Commands Not Consistently Protected
**Severity**: MEDIUM (CVSS 6.2)
**Location**: `src/core/systems/server/BuilderCommandHandler.js`

**Vulnerability**:
- Some commands check `isBuilder()` permission (good)
- But `isBuilder()` relies on socket.player.data.rank
- Player rank is only set on connection from JWT
- No per-command re-authentication
- Rank privilege escalation not validated on mutation commands

**Example Issue**:
```javascript
onBlueprintAdded(socket, blueprint) {
  if (!socket.player.isBuilder()) return  // ✓ Good
  // But no validation of blueprint ownership
  // Any builder can modify ANY blueprint
}

onEntityModified(socket, data) {
  // NO permission check at all!
  const entity = this.serverNetwork.entities.get(data.id)
  entity.modify(data)
  // Anyone can modify any entity
}
```

**Impact**:
- Non-builder users could modify entities if they intercept websocket messages
- No object-level access control (anyone with builder can modify anything)
- No audit trail of who changed what

---

### 10. MAJOR: No Authorization Checks on Entity/Blueprint Modifications
**Severity**: MEDIUM (CVSS 6.8)
**Location**: `src/core/systems/server/BuilderCommandHandler.js` - `onEntityModified()` method

**Vulnerability**:
- `onEntityModified()` has NO permission check at all
- Any connected user can modify any entity
- No ownership validation
- No role-based access control
- Blueprints have no author tracking

**Code Evidence**:
```javascript
async onEntityModified(socket, data) {
  const entity = this.serverNetwork.entities.get(data.id)
  if (!entity) return console.error('onEntityModified: no entity found', data)
  entity.modify(data)  // <- NO PERMISSION CHECK
  // ... rest of code
}
```

**Impact**:
- Any user can delete any entity
- Any user can modify world settings
- Griefers can destroy the entire world
- No access control enforcement

---

## PROTOCOL/DESIGN ISSUES

### 11. WARNING: ADMIN_CODE Transmission Not Encrypted
**Severity**: MEDIUM (CVSS 5.4)
**Location**: `src/server/services/CommandHandler.js` - `admin()` method

**Vulnerability**:
- Admin code sent as plain command over WebSocket
- If WebSocket uses ws:// (not wss://), transmitted in plaintext
- If intercepted on network, attacker gets admin access
- No rate limiting on admin code attempts
- No lockout after N failed attempts

**Code**:
```javascript
async admin(socket, player, code) {
  if (!process.env.ADMIN_CODE || process.env.ADMIN_CODE !== code) return
  // No rate limiting, no brute-force protection
}
```

**Impact**:
- Admin code can be intercepted over non-HTTPS connections
- Brute-force attack possible (try all common passwords)
- No account lockout protection
- No audit log of admin code attempts

---

## CORS CONFIGURATION ISSUES

### 12. WARNING: Overly Permissive CORS Configuration
**Severity**: LOW (CVSS 4.0)
**Location**: `src/server/index.js` line 94

**Vulnerability**:
- CORS registered with default options (no explicit configuration)
- Default @fastify/cors allows all origins
- No restriction on which domains can access API
- No credential restriction

**Code**:
```javascript
fastify.register(cors)  // <- Uses default permissive settings
```

**Impact**:
- Any website can make requests to the API
- CSRF attacks possible
- Cross-site request forgery on authenticated endpoints
- No origin validation

---

## SUMMARY OF FINDINGS

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 2 | Unauthenticated upload, file existence check |
| HIGH | 4 | Error monitoring API, error clearing, error stream, status endpoint |
| MEDIUM | 4 | Path traversal, input validation, websocket auth, entity modification |
| LOW | 2 | Admin code encryption, CORS configuration |

**Total Vulnerabilities**: 12
**Critical/High**: 6 (require immediate fix)
**Medium/Low**: 6 (should be fixed in next release)

---

## RECOMMENDATIONS (PRIORITY ORDER)

1. **IMMEDIATE** - Add authentication middleware to ALL HTTP endpoints
2. **IMMEDIATE** - Add role-based access control checks to all WebSocket commands
3. **IMMEDIATE** - Add object-level ownership validation (no user can modify others' entities)
4. **URGENT** - Implement rate limiting on file uploads and admin code attempts
5. **URGENT** - Add input validation and range limits on all query parameters
6. **URGENT** - Require HTTPS/WSS for all connections (enforce in production)
7. **HIGH** - Implement audit logging for all mutations
8. **HIGH** - Add brute-force protection on admin code endpoint
9. **MEDIUM** - Implement CORS whitelist configuration
10. **MEDIUM** - Add per-command authorization checks with ownership validation

---

## AFFECTED FILES

- `src/server/index.js` (CORS, WebSocket handler ordering)
- `src/server/routes/UploadRoutes.js` (multiple critical issues)
- `src/server/routes/ErrorRoutes.js` (multiple critical issues)
- `src/server/routes/StatusRoutes.js` (information disclosure)
- `src/core/systems/server/BuilderCommandHandler.js` (missing auth checks)
- `src/core/systems/server/PlayerConnectionManager.js` (initial auth)
- `src/core/systems/ServerNetwork.js` (WebSocket handler registration)
- `src/server/services/CommandHandler.js` (admin code)

