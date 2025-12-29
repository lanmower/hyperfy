# Feature Flags System

Graceful degradation through feature flags without hardcoded environment checks.

## Overview

The feature flag system provides:
- **Runtime feature control** - Enable/disable features without deployment
- **Gradual rollout** - Percentage-based rollout to manage risk
- **User-specific control** - Different users see different features
- **Dependency management** - Prevent broken feature combinations
- **Deprecation tracking** - Manage feature lifecycle
- **Audit trail** - History of all flag state changes

## Core Components

### 1. FeatureFlag
Individual feature flag definition.

**Methods**:
- `isEnabled(context)` - Check if enabled for context
- `getStatus()` - Get current status
- `checkDependencies(featureManager)` - Validate dependencies
- `isDeprecated()` - Check if deprecated
- `getDeprecationAge()` - Get age since deprecation

### 2. FeatureManager
Centralized feature management.

**Methods**:
- `register(name, config)` - Register new flag
- `isEnabled(name, context)` - Check if enabled
- `enable/disable(name)` - Control flag
- `setRollout(name, percentage)` - Set rollout %
- `getAll()` / `getEnabled()` / `getDeprecated()` - Query
- `validate()` - Check for issues
- `getStats()` - Get statistics

### 3. FeatureRegistry
Pre-defined default features with initialization.

## Usage Pattern

```javascript
import { featureManager } from 'src/core/features'

// Check feature
if (featureManager.isEnabled('vr_support')) {
  enableVRFeatures()
} else {
  enableDesktopFeatures()  // Fallback
}

// Gradual rollout
featureManager.register('new_feature', {
  enabled: true,
  rolloutPercentage: 10  // Start at 10%
})

// Increase rollout over time
featureManager.setRollout('new_feature', 50)  // 50%
featureManager.setRollout('new_feature', 100)  // 100%

// User-specific features
const context = { userId: 'user123', region: 'us-west' }
if (featureManager.isEnabled('premium_feature', context)) {
  // User has access
}
```

## Pre-defined Features

| Feature | Status | Rollout | Purpose |
|---------|--------|---------|---------|
| vr_support | ✅ | 100% | VR headset support |
| physics_v2 | ✅ | 100% | New physics engine |
| network_compression | ✅ | 100% | Network optimization |
| advanced_avatar | ✅ | 80% | Enhanced avatars |
| live_chat | ✅ | 100% | Real-time messaging |
| spatial_audio | ✅ | 90% | 3D sound |
| voice_chat | ✅ | 100% | Voice comms |
| ai_agents | ❌ | 0% | AI NPCs |
| marketplace | ❌ | 25% | In-world store |
| nft_support | ❌ | 0% | NFT features |

## Benefits

✓ No hardcoded env checks
✓ Runtime feature control
✓ Gradual rollout management
✓ User-specific features
✓ Dependency tracking
✓ Deprecation management
✓ Audit trail & history
✓ Easy fallback code
✓ Zero deployment changes

## Files

- src/core/features/FeatureFlag.js
- src/core/features/FeatureManager.js
- src/core/features/FeatureRegistry.js
- src/core/features/index.js
