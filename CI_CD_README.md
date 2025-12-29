# CI/CD Pipeline Implementation

## Overview

Complete automated CI/CD pipeline for Hyperfy with GitHub Actions workflows, deployment verification, rollback procedures, and Coolify integration.

## Architecture

### Workflow Files (.github/workflows/)

#### 1. deploy.yml - Automatic Production Deployment
- **Trigger**: Push to main branch
- **Steps**:
  - Checkout code with full history
  - Setup Node.js 22.11.0
  - Install dependencies (npm ci)
  - Lint code
  - Build client bundle
  - Build full project
  - Run pre-deployment verification
  - Create deployment artifact
  - Upload artifact to Actions (30-day retention)
  - Trigger Coolify webhook
  - Create release tag
  - Generate deployment summary

#### 2. test.yml - PR Testing Pipeline
- **Trigger**: Pull requests to main, pushes to main
- **Steps**:
  - Checkout code with conflict detection
  - Setup Node.js
  - Install dependencies
  - Lint enforcement
  - Format check
  - Full project build
  - Pre-deployment verification
  - Playwright test execution
  - Upload test reports
  - Auto-comment on PR with build status

#### 3. manual-deploy.yml - Manual Environment Deployment
- **Trigger**: Manual dispatch from GitHub Actions UI
- **Environment Selection**: Staging or Production
- **Steps**:
  - Create GitHub deployment record
  - Build for selected environment
  - Run all checks
  - Create timestamped artifact
  - Deploy via Coolify webhook
  - Update deployment status
  - Send notifications

## Configuration Files

### deployment.config.js
Environment-specific configuration with:
- Development, staging, and production settings
- API endpoints per environment
- Feature flags
- Build configurations
- Bundle size thresholds
- Health check settings
- Deployment retry policies

**Example**:
```javascript
environments: {
  production: {
    apiUrl: 'https://api.hyperfy.io',
    cdn: { enabled: true, domain: 'cdn.hyperfy.io' },
    healthCheck: { enabled: true, interval: 60000 }
  }
}
```

### .env.ci.example
Environment variables for CI/CD:
- COOLIFY_WEBHOOK: Deployment endpoint
- DEPLOYMENT_TOKEN: Authentication
- API endpoints per environment
- Health check configuration
- Artifact retention policies

## Build Scripts

### Package.json Scripts

```bash
npm run build              # Production build
npm run build:staging      # Staging-optimized build
npm run verify             # Pre-deployment checks
npm run rollback           # Rollback to previous version
npm run lint              # Code quality checks
npm run format            # Code formatting
npm run test:playwright   # End-to-end tests
```

## Pre-Deployment Verification (verify-deploy.js)

Runs automatically on all deployments. Checks:

1. **Build Directory**: Validates existence and non-empty state
2. **Build Artifacts**: Verifies index.html, client bundle, server bundle
3. **Bundle Size**: Warns if >400KB, fails if >600KB
4. **Secrets**: Scans for hardcoded API keys, passwords, tokens
5. **Console Statements**: Detects leftover debug logs
6. **Source Maps**: Validates source map presence
7. **Package.json**: Verifies version and metadata

**Usage**:
```bash
npm run verify
```

## Rollback Procedure (rollback.js)

Safe rollback to previous versions:

1. **List Available Versions**: Shows last 20 release tags
2. **Checkout Selected Version**: Git checkout to target tag
3. **Rebuild**: Install dependencies and build
4. **Health Check**: Validates deployment health
5. **Record History**: Logs rollback event with timestamp
6. **Atomic Operation**: Entire process is atomic (succeeds or fails completely)

**Usage**:
```bash
npm run rollback
# Select version by number (1, 2, 3, etc.)
```

**Output**:
```
Available versions to rollback to:
  1. v0.15.0-abc1234
  2. v0.14.9-def5678
  3. v0.14.8-ghi9012

Select version [1-20]: 1
```

## Coolify Integration

### Webhook Handler (coolify-deploy.js)

Registered endpoint: `POST /api/webhook/coolify-deploy`

**Request Format**:
```json
{
  "event": "deployment|manual_deployment",
  "commit": "abc1234",
  "branch": "main",
  "environment": "staging|production",
  "version": "0.15.0",
  "timestamp": "2025-12-27T13:52:00Z"
}
```

**Response**:
```json
{
  "deploymentId": "abc1234-1703672700000",
  "status": "accepted|in_progress|completed|failed",
  "message": "Deployment queued"
}
```

### Deployment Status Endpoint

- **GET** `/api/webhook/coolify-deploy/:deploymentId`
- Returns current deployment state, progress, errors

### Automatic Rollback

If health check fails after deployment:
1. Automatically triggers rollback
2. Checks out previous release tag
3. Rebuilds and verifies
4. Logs rollback event

## Validation

### CI Configuration Validator (validate-ci-config.js)

Validates entire CI/CD setup:
- Workflow file presence and format
- deployment.config.js validity
- Script file existence
- package.json script completeness
- Environment file configuration
- Git configuration

**Usage**:
```bash
node src/scripts/validate-ci-config.js
```

## GitHub Secrets Required

Set these in GitHub repository settings (Settings > Secrets and variables > Actions):

```
COOLIFY_WEBHOOK              # Deployment webhook URL
DEPLOYMENT_TOKEN             # Authentication token
STAGING_URL                  # Staging environment URL
PRODUCTION_URL               # Production environment URL
```

## Deployment Flow

### Automatic (Push to main)
```
Push → Lint → Build → Verify → Create Artifact → Trigger Coolify → Success
                                                       ↓
                                              (Health Check)
                                                       ↓
                                            Automatic Rollback on failure
```

### Manual (GitHub Actions UI)
```
Trigger Manual Deploy → Select Environment → Build → Verify → Deploy → Update Status
```

### Rollback
```
Run Rollback → Select Version → Checkout → Rebuild → Health Check → Record History
```

## Key Features

1. **Atomic Deployments**: All-or-nothing deployment logic
2. **Automatic Rollback**: Failed deployments trigger automatic rollback
3. **Health Checks**: POST-deployment verification
4. **Artifact Management**: 7-90 day retention per environment
5. **Build Optimization**: Separate staging and production builds
6. **Security Scanning**: Secrets and hardcoded values detection
7. **PR Integration**: Auto-comments with build status
8. **Deployment History**: Tags and logs for all deployments
9. **Manual Overrides**: Can deploy any version to any environment
10. **Webhook Integration**: Coolify-compatible deployment triggers

## Monitoring & Notifications

### Deployment Artifacts
- Available in GitHub Actions: Artifacts tab
- Retain for 7-90 days depending on environment
- Include build metadata (hash, size, timestamp)

### Deployment Tags
- Auto-created on successful deployment
- Format: `v{version}-{commit-hash}`
- Enable quick rollback identification

### Health Checks
- Staging: Every 30 seconds
- Production: Every 60 seconds
- 30-second timeout for health check
- Multiple endpoint support

## Troubleshooting

### Deployment Failed
1. Check GitHub Actions logs
2. Run `npm run verify` locally
3. Check bundle size warnings
4. Verify all secrets configured

### Rollback Not Working
1. Ensure previous version tags exist: `git tag`
2. Check .rollback-history.json for history
3. Manual rollback: `git checkout <tag> && npm run build`

### Health Check Timeout
1. Verify service is running on HEALTH_CHECK_URL
2. Increase timeout in deployment.config.js
3. Check server logs for startup issues

## Files Created

### Workflows
- `.github/workflows/deploy.yml` (96 lines)
- `.github/workflows/test.yml` (75 lines)
- `.github/workflows/manual-deploy.yml` (130 lines)

### Configuration
- `deployment.config.js` (185 lines)
- `.env.ci.example` (27 lines)

### Scripts
- `src/scripts/verify-deploy.js` (280 lines)
- `src/scripts/rollback.js` (250 lines)
- `src/scripts/validate-ci-config.js` (280 lines)

### Integration
- `src/server/webhooks/coolify-deploy.js` (240 lines)

### Updated
- `package.json` (added 4 scripts)

## Next Steps

1. **Configure GitHub Secrets**:
   ```bash
   # In GitHub repo settings, add:
   COOLIFY_WEBHOOK=https://your-coolify-instance/webhook
   DEPLOYMENT_TOKEN=your-token
   ```

2. **Configure Coolify**:
   - Point Coolify webhook to: `https://your-domain/api/webhook/coolify-deploy`
   - Ensure service listens on HEALTH_CHECK_URL

3. **Test Locally**:
   ```bash
   npm run verify      # Test verification
   npm run build       # Test build
   ```

4. **First Deployment**:
   - Push to main to trigger automatic deploy
   - Monitor GitHub Actions
   - Verify health check passes
   - Check deployment artifact

5. **Enable Notifications**:
   - Configure Slack/email in deployment.config.js
   - Update .env for notification endpoints

## Maintenance

- Review deployment history weekly
- Archive old release tags monthly
- Update thresholds in deployment.config.js as needed
- Test rollback procedures quarterly
- Monitor build time trends
- Optimize bundle size regularly
