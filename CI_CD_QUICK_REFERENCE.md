# CI/CD Quick Reference

## File Locations

```
.github/workflows/
  ├─ deploy.yml              # Auto-deploy on push to main
  ├─ test.yml                # PR testing pipeline
  └─ manual-deploy.yml       # Manual environment deployment

Root:
  ├─ deployment.config.js    # Environment configuration
  ├─ .env.ci.example         # Environment variables template
  └─ CI_CD_README.md         # Full documentation

src/scripts/
  ├─ verify-deploy.js        # Pre-deployment verification
  ├─ rollback.js             # Rollback to previous version
  └─ validate-ci-config.js   # Validate CI/CD configuration

src/server/webhooks/
  └─ coolify-deploy.js       # Coolify webhook handler
```

## NPM Scripts

```bash
npm run build              # Production build
npm run build:staging      # Staging build
npm run verify             # Pre-deployment checks
npm run rollback           # Rollback to previous version
npm run lint               # Code quality check
npm run format             # Auto-format code
npm run test:playwright    # Run end-to-end tests
```

## Deployment Triggers

### Automatic (deploy.yml)
```bash
git push origin main  # Triggers automatic deployment
```

### Manual (manual-deploy.yml)
1. Go to GitHub Actions
2. Select "Manual Deploy" workflow
3. Click "Run workflow"
4. Select environment (staging or production)

### Rollback (npm script)
```bash
npm run rollback
# Select version from numbered list
```

## Coolify Webhook

**Endpoint**: `POST /api/webhook/coolify-deploy`

**Request**:
```json
{
  "event": "deployment",
  "commit": "abc1234",
  "branch": "main",
  "environment": "production",
  "version": "0.15.0"
}
```

**Response**:
```json
{
  "deploymentId": "abc1234-1234567890",
  "status": "accepted",
  "message": "Deployment queued"
}
```

**Status Check**: `GET /api/webhook/coolify-deploy/{deploymentId}`

## Environment Configuration

Edit `deployment.config.js` for:
- API endpoints
- Feature flags
- Build settings
- Health check intervals
- Bundle size limits

## GitHub Secrets

Set in GitHub Settings > Secrets and variables > Actions:

```
COOLIFY_WEBHOOK=https://coolify.example.com/webhook
DEPLOYMENT_TOKEN=your-secret-token
STAGING_URL=https://staging.hyperfy.io
PRODUCTION_URL=https://hyperfy.io
```

## Verification Checks

Automatic checks on all deployments:

1. ✓ Build directory exists
2. ✓ Required artifacts present
3. ✓ Bundle size <600KB
4. ✓ No hardcoded secrets
5. ✓ No debug console logs
6. ✓ Source maps valid
7. ✓ package.json valid

## Bundle Size Limits

```javascript
WARN:  >400KB
FAIL:  >600KB
```

## Deployment Flow

```
push to main
    ↓
lint check
    ↓
build project
    ↓
verification
    ↓
create artifact
    ↓
trigger coolify
    ↓
health check
    ↓
✓ success or ↓ failure
    ↓
auto-rollback
```

## Rollback Process

```
npm run rollback
    ↓
select version
    ↓
git checkout <tag>
    ↓
npm ci
    ↓
npm run build
    ↓
health check
    ↓
✓ complete
```

## Troubleshooting

**Deployment Failed**
```bash
npm run verify                    # Check artifacts locally
npm run lint                      # Check code quality
npm run build                     # Test build locally
```

**Health Check Timeout**
- Check service is running on localhost:3000
- Verify `/health` endpoint exists
- Increase timeout in deployment.config.js

**Secrets Detected**
- Run verify-deploy.js locally
- Remove any hardcoded secrets
- Use environment variables instead

**Rollback Not Working**
```bash
git tag                           # List available versions
git describe --tags --abbrev=0   # Show current version
```

## Configuration Examples

### Development
```javascript
{
  apiUrl: 'http://localhost:3000',
  logLevel: 'debug',
  features: { devTools: true, debugGlobals: true }
}
```

### Staging
```javascript
{
  apiUrl: 'https://staging-api.hyperfy.io',
  logLevel: 'info',
  healthCheck: { interval: 30000, timeout: 5000 }
}
```

### Production
```javascript
{
  apiUrl: 'https://api.hyperfy.io',
  logLevel: 'warn',
  healthCheck: { interval: 60000, timeout: 10000 },
  rateLimit: { requests: 1000, window: 60000 }
}
```

## Artifact Retention

- Development: 7 days
- Staging: 30 days
- Production: 90 days

Access artifacts in GitHub Actions > Artifacts tab

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| deploy.yml | Auto production deploy | 98 |
| test.yml | PR testing | 83 |
| manual-deploy.yml | Manual deployment | 149 |
| deployment.config.js | Configuration | 158 |
| verify-deploy.js | Pre-deploy checks | 332 |
| rollback.js | Version rollback | 225 |
| coolify-deploy.js | Webhook handler | 241 |

## Status Monitoring

Check deployment status:
```bash
# GitHub Actions
https://github.com/hyperfy-xyz/hyperfy/actions

# Recent deployments
https://github.com/hyperfy-xyz/hyperfy/releases

# Deployment webhook status
GET /api/webhook/coolify-deploy/{deploymentId}
```

## Security

- No secrets in code
- GitHub Secrets for tokens/keys
- Pre-deployment scanning
- Console log detection
- Environment variable separation

## Support

For full documentation, see: `CI_CD_README.md`

For configuration details, edit: `deployment.config.js`

For environment setup, copy: `.env.ci.example` → `.env.ci`

## Summary

Complete production-ready CI/CD pipeline with:
- Automatic deployments
- Manual overrides
- Health checks
- Automatic rollback
- Artifact management
- Security scanning
- Multi-environment support
