# Hyperfy API Security Guidelines

**Version**: 1.0
**Last Updated**: December 27, 2025
**Status**: Active

---

## Quick Reference: Authentication Token Format

All protected API endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

The JWT token is provided by the server during player connection and contains:
```javascript
{
  userId: "player-uuid-here"
}
```

---

## API Endpoints Security Matrix

### Public Endpoints (No Authentication Required)

| Endpoint | Method | Purpose | Rate Limited |
|----------|--------|---------|--------------|
| `/health` | GET | Health check | No |
| `/` | GET | Main HTML page | No |
| `/assets/*` | GET | Static assets | No |
| `/env.js` | GET | Public environment variables | No |

### Protected Endpoints (Authentication Required)

| Endpoint | Method | Purpose | Auth Required | Rate Limit |
|----------|--------|---------|----------------|-----------|
| `/status` | GET | Server status | JWT Token | No |
| `/status/full` | GET | Full details (admin only) | JWT Token + Admin | 30/min |
| `/api/errors` | GET | Get error logs | JWT Token + Admin | 30/min |
| `/api/errors/clear` | POST | Clear error logs | JWT Token + Admin | 30/min |
| `/api/errors/stream` | WS | Error stream | JWT Token + Admin | No |
| `/api/upload` | POST | Upload file | None | 10/min per IP |
| `/api/upload-check` | GET | Check file exists | None | No |
| `/ws` | WS | Main game WebSocket | JWT Query param | No |

### WebSocket Commands (Game Protocol)

All WebSocket commands are authenticated via the socket connection. The player's rank
is validated on each command that modifies data.

**Builder Commands** (require `rank >= 1`):
- `blueprintAdded` - Add new blueprint
- `blueprintModified` - Modify blueprint
- `entityAdded` - Add new entity
- `entityModified` - Modify entity (with ownership check)
- `entityRemoved` - Remove entity
- `settingsModified` - Modify world settings
- `spawnModified` - Modify spawn point

**Admin Commands** (require `rank >= 2`):
- `modifyRank` - Change player ranks
- `kick` - Kick players
- `mute` - Mute players

---

## Security Implementation Details

### Rate Limiting Strategy

**File Upload Rate Limiting**:
```javascript
const MAX_REQUESTS_PER_IP_PER_MINUTE = 10

// Tracked per-IP with timestamp-based filtering
// Automatically cleans old entries
// Returns 429 Too Many Requests when exceeded
```

**Admin API Rate Limiting**:
```javascript
const MAX_ADMIN_REQUESTS_PER_IP_PER_MINUTE = 30

// Separate from file uploads
// Prevents admin enumeration attacks
// Logged when exceeded
```

**Admin Code Brute-Force Protection**:
```javascript
const MAX_ADMIN_ATTEMPTS = 5
const ADMIN_LOCKOUT_TIME = 5 * 60 * 1000  // 5 minutes

// Per-IP tracking
// Automatic lockout after 5 failures
// Logged for security monitoring
```

### Input Validation Rules

**File Uploads**:
- ✅ File size: 1 byte to 200 MB (checked during streaming)
- ✅ File type: Any except .exe, .bat, .cmd, .com, .pif, .scr, .vbs, .js
- ❌ Missing file: Rejected with 400 Bad Request
- ❌ Oversized file: Rejected with 413 Payload Too Large
- ❌ Blocked extension: Rejected with 400 Bad Request

**File Existence Check**:
- ✅ Hash format: Exactly 64 hexadecimal characters
- ❌ Invalid hash: Rejected with 400 Bad Request
- ❌ Path traversal attempt: Rejected with 400 Bad Request

**Error API Query Parameters**:
- `limit`: 1-1000 (default 50)
- `type`: 'error' | 'warning' | 'critical' | 'info' | 'debug'
- `side`: 'client' | 'server' | 'client-reported'
- `since`: UNIX timestamp (numeric)
- `critical`: 'true' | 'false'

**Invalid parameters are silently ignored** with safe defaults

### Ownership & Authorization

**Builder Permission**:
- Can create blueprints and entities
- Can modify only their own app entities
- Cannot modify other builders' entities
- Cannot modify world settings or spawn

**Admin Permission**:
- Can modify any entity
- Can modify any blueprint
- Can change world settings
- Can modify spawn point
- Can grant/revoke builder status

**Ownership Validation Example**:
```javascript
// Builder creating an entity
if (entity.isApp && !socket.player.isAdmin()) {
  const ownerUserId = entity.data.userId
  if (ownerUserId && ownerUserId !== socket.player.data.userId) {
    // Reject: Not the owner
    return
  }
}
```

---

## Authentication Flow

### Initial Connection

1. Client connects to `/ws` with query parameters:
   ```javascript
   {
     authToken: "jwt-token-or-null",
     name: "PlayerName",
     avatar: "avatar-url"
   }
   ```

2. Server validates token or creates new user:
   ```javascript
   if (authToken) {
     user = await loadUser(readJWT(authToken).userId)
   } else {
     user = createAnonymousUser()
   }
   ```

3. Server sends back new/updated JWT token to client

4. Client stores token for future use

### Subsequent Requests

All HTTP API requests include:
```
Authorization: Bearer <stored-jwt-token>
```

WebSocket messages are authenticated via the socket connection established in step 1.

---

## Common Security Mistakes & How to Avoid Them

### ❌ MISTAKE: Trusting user input directly

```javascript
// BAD - Directly trusting entity ID from client
const entity = world.entities.get(data.id)
entity.modify(data)  // No validation
```

### ✅ CORRECT: Validate ownership before modification

```javascript
// GOOD - Check permissions first
if (!socket.player.isBuilder()) return
const entity = world.entities.get(data.id)
if (entity.isApp && entity.data.userId !== socket.id) return
entity.modify(data)
```

---

### ❌ MISTAKE: Exposing sensitive information

```javascript
// BAD - Leaking player positions
return {
  connectedUsers: [
    { id: userId, position: [x, y, z] }  // Doxxing vector
  ]
}
```

### ✅ CORRECT: Only return necessary information

```javascript
// GOOD - No sensitive player data
return {
  connectedUsersCount: 5  // Just the count
}
```

---

### ❌ MISTAKE: Missing rate limiting on abuse-prone endpoints

```javascript
// BAD - Can enumerate all files
fastify.get('/api/upload-check', async (req, reply) => {
  const exists = await fs.exists(req.query.filename)  // No rate limit
})
```

### ✅ CORRECT: Rate limit and validate input

```javascript
// GOOD - Rate limited and validated
fastify.get('/api/upload-check', async (req, reply) => {
  const clientIP = getClientIP(req)
  if (!checkRateLimit(clientIP)) {
    return reply.code(429).send({ error: 'Rate limit exceeded' })
  }

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return reply.code(400).send({ error: 'Invalid hash' })
  }
})
```

---

### ❌ MISTAKE: No brute-force protection on sensitive operations

```javascript
// BAD - Can brute-force admin code instantly
async admin(socket, player, code) {
  if (process.env.ADMIN_CODE === code) {
    grantAdmin(player)
  }
}
```

### ✅ CORRECT: Rate limit and lockout

```javascript
// GOOD - Brute-force protection
async admin(socket, player, code) {
  const clientIP = getClientIP(socket.ws)

  if (!checkAdminAttempts(clientIP)) {
    console.warn(`Brute-force attempt from ${clientIP}`)
    return
  }

  if (process.env.ADMIN_CODE === code) {
    resetAdminAttempts(clientIP)
    grantAdmin(player)
  }
}
```

---

## Audit Logging

### What Gets Logged

All security-relevant events are logged with `[SECURITY]` or `[AUDIT]` prefixes:

```javascript
// Failed authentication
console.warn('[SECURITY] Authentication failed for request from 192.168.1.1')

// Brute-force attempt
console.warn('[SECURITY] Admin code brute-force attempt blocked from IP: 192.168.1.1')

// Unauthorized action
console.error('[SECURITY] Player attempted to modify entity they do not own')

// Successful privilege change
console.log('[AUDIT] Admin privilege granted to player John (user-123)')

// Error log clearing
console.log('[AUDIT] Errors cleared by admin (450 errors)')
```

### Monitoring These Logs

In production, set up alerting for:
- `[SECURITY]` messages (potential attacks)
- `[AUDIT]` messages (admin actions)
- Rate limit exceeded messages
- Authentication failures

### Log Retention

Logs are currently in-memory. For production:
1. Pipe logs to a persistent logging service
2. Keep logs for at least 90 days
3. Alert on suspicious patterns
4. Regular log reviews for security incidents

---

## Testing Security Fixes

### Test Authentication

```bash
# Should fail (no auth)
curl http://localhost:3000/api/errors
# Expected: 401 Unauthorized

# Should fail (invalid token)
curl http://localhost:3000/api/errors \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized

# Should succeed (valid token)
curl http://localhost:3000/api/errors \
  -H "Authorization: Bearer <valid-jwt>"
# Expected: 200 with error data
```

### Test Rate Limiting

```bash
# Test file upload rate limit (make 11 requests)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/upload \
    -F "file=@test.txt"
done
# Request 11+ should return 429 Too Many Requests
```

### Test Input Validation

```bash
# Test invalid hash format
curl "http://localhost:3000/api/upload-check?hash=invalid"
# Expected: 400 Bad Request

# Test path traversal
curl "http://localhost:3000/api/upload-check?hash=../../etc/passwd"
# Expected: 400 Bad Request

# Test oversized limit parameter
curl "http://localhost:3000/api/errors?limit=999999999" \
  -H "Authorization: Bearer <token>"
# Expected: Returns max 1000 records (rate limited too)
```

### Test Authorization

```bash
# Test non-builder modifying entity
# (Send entityModified message via WebSocket as non-builder)
# Expected: No modification, error logged

# Test builder modifying other's entity
# (Send entityModified for entity owned by different user)
# Expected: No modification, error logged

# Test admin modifying other's entity
# (Send entityModified as admin)
# Expected: Modification succeeds
```

---

## Incident Response

### If You Suspect a Breach

1. **Immediate Actions**:
   - Disable compromised admin codes
   - Rotate all credentials
   - Review recent audit logs
   - Check for unusual entity modifications

2. **Investigation**:
   - Look for `[SECURITY]` log messages
   - Check failed authentication attempts
   - Review admin privilege grants
   - Look for unusual file uploads

3. **Remediation**:
   - Roll back unauthorized changes
   - Reset all passwords/tokens
   - Update CORS origin if changed
   - Reapply security patches

4. **Communication**:
   - Notify affected users
   - Document incident
   - Update security practices

---

## Regular Security Maintenance

### Daily
- Monitor logs for `[SECURITY]` messages
- Check rate limit patterns
- Monitor server resources

### Weekly
- Review failed authentication attempts
- Check for suspicious file uploads
- Verify backups are working

### Monthly
- Rotate admin codes
- Review access patterns
- Update security documentation

### Quarterly
- Full security audit
- Dependency updates
- Penetration testing

---

## Environment Variable Security

### Production Configuration

```bash
# CORS - restrict to your domain
CORS_ORIGIN=https://yourdomain.com

# Admin code - strong random string
ADMIN_CODE=$(openssl rand -hex 16)

# Optional: Analytics/monitoring
COMMIT_HASH=$(git rev-parse HEAD)
PUBLIC_API_URL=https://api.yourdomain.com
PUBLIC_ASSETS_URL=https://cdn.yourdomain.com
PUBLIC_MAX_UPLOAD_SIZE=52428800  # 50MB

# Database/persistence (internal)
WORLD=prod-world
SAVE_INTERVAL=60
```

### Never Commit to Git

```bash
# DO NOT commit:
- .env files with actual values
- ADMIN_CODE values
- JWT secret keys
- Database credentials

# DO commit:
- .env.example (with placeholder values)
- Security documentation
- Configuration schemas
```

---

## Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

## Questions?

For questions about the security implementation:
1. Review the code in `src/server/routes/` and `src/server/services/`
2. Check `SECURITY_AUDIT.md` for detailed vulnerability descriptions
3. Check `SECURITY_FIXES_APPLIED.md` for implementation details
4. Look for comments in security-critical code sections
