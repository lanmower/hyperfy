const BASE_URL = process.env.PUBLIC_ASSETS_URL || 'http://localhost:3000'
const ADMIN_CODE = process.env.ADMIN_CODE || 'test-admin-code'

async function testRateLimiting() {
  console.log('=== Rate Limiting Test ===\n')

  console.log('Test 1: Health endpoint rate limiting (60 requests/min limit)')
  let successCount = 0
  let rateLimitedCount = 0

  for (let i = 0; i < 70; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`)
      if (response.status === 200) {
        successCount++
      } else if (response.status === 429) {
        rateLimitedCount++
        const data = await response.json()
        console.log(`  Request ${i + 1}: Rate limited - ${data.error} (retryAfter: ${data.retryAfter}s)`)
        break
      }
    } catch (error) {
      console.error(`  Request ${i + 1} failed:`, error.message)
    }
  }

  console.log(`  Success: ${successCount}, Rate Limited: ${rateLimitedCount}\n`)

  console.log('Test 2: Get rate limit stats')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/rate-limits`, {
      headers: {
        'X-Admin-Code': ADMIN_CODE,
      },
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log('  Rate limit stats:', JSON.stringify(data.stats, null, 2))
      console.log('  Recent violations:', JSON.stringify(data.stats.recentViolations, null, 2))
    } else {
      console.log('  Failed to get stats:', response.status)
    }
  } catch (error) {
    console.error('  Error getting stats:', error.message)
  }

  console.log('\n')
}

async function testFeatureFlags() {
  console.log('=== Feature Flags Test ===\n')

  console.log('Test 1: Get all feature flags')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
      headers: {
        'X-Admin-Code': ADMIN_CODE,
      },
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log('  Feature flags:')
      for (const [key, value] of Object.entries(data.flags)) {
        console.log(`    ${key}: enabled=${value.enabled}, rollout=${value.rollout}%`)
      }
      console.log('\n  Stats:', JSON.stringify(data.stats, null, 2))
    } else {
      console.log('  Failed to get flags:', response.status)
    }
  } catch (error) {
    console.error('  Error getting flags:', error.message)
  }

  console.log('\nTest 2: Toggle feature flag (betaFeatures)')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Code': ADMIN_CODE,
      },
      body: JSON.stringify({
        flag: 'betaFeatures',
        enabled: true,
      }),
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log('  Toggled betaFeatures:', JSON.stringify(data.flag, null, 2))
    } else {
      console.log('  Failed to toggle:', response.status)
    }
  } catch (error) {
    console.error('  Error toggling flag:', error.message)
  }

  console.log('\nTest 3: Set rollout percentage (betaFeatures to 50%)')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags/betaFeatures/rollout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Code': ADMIN_CODE,
      },
      body: JSON.stringify({
        percentage: 50,
      }),
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log('  Set rollout:', JSON.stringify(data.flag, null, 2))
    } else {
      console.log('  Failed to set rollout:', response.status)
    }
  } catch (error) {
    console.error('  Error setting rollout:', error.message)
  }

  console.log('\nTest 4: A/B test variant assignment (100 random users)')
  const variants = { treatment: 0, control: 0 }

  for (let i = 0; i < 100; i++) {
    const userId = `user-${Math.random().toString(36).substring(7)}`

    try {
      const response = await fetch(`${BASE_URL}/api/admin/feature-flags/betaFeatures/variant/${userId}`, {
        headers: {
          'X-Admin-Code': ADMIN_CODE,
        },
      })

      if (response.status === 200) {
        const data = await response.json()
        variants[data.variant.variant]++
      }
    } catch (error) {
      console.error('  Error getting variant:', error.message)
    }
  }

  console.log(`  Variant distribution (50% rollout):`)
  console.log(`    Treatment (feature enabled): ${variants.treatment}%`)
  console.log(`    Control (feature disabled): ${variants.control}%`)

  console.log('\nTest 5: Create custom feature flag')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Code': ADMIN_CODE,
      },
      body: JSON.stringify({
        flag: 'customFeature',
        description: 'A custom feature for testing',
        enabled: true,
        rollout: 100,
      }),
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log('  Created custom flag:', JSON.stringify(data.flag, null, 2))
    } else {
      const error = await response.json()
      console.log('  Failed to create flag:', error.error)
    }
  } catch (error) {
    console.error('  Error creating flag:', error.message)
  }

  console.log('\nTest 6: Get flag history (betaFeatures)')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags/betaFeatures/history`, {
      headers: {
        'X-Admin-Code': ADMIN_CODE,
      },
    })

    if (response.status === 200) {
      const data = await response.json()
      console.log('  Flag history:')
      data.history.forEach((entry, i) => {
        console.log(`    ${i + 1}. ${entry.timestamp} - ${entry.reason} (enabled: ${entry.enabled}, rollout: ${entry.rollout}%)`)
      })
    } else {
      console.log('  Failed to get history:', response.status)
    }
  } catch (error) {
    console.error('  Error getting history:', error.message)
  }

  console.log('\n')
}

async function runTests() {
  console.log('Starting tests...\n')
  console.log('NOTE: Set ADMIN_CODE environment variable to test admin endpoints\n')

  await testRateLimiting()
  await testFeatureFlags()

  console.log('Tests complete!')
}

runTests()
