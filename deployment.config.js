export default {
  environments: {
    development: {
      name: 'development',
      apiUrl: 'http://localhost:3000',
      logLevel: 'debug',
      features: {
        devTools: true,
        debugGlobals: true,
        performanceMonitoring: true,
        errorReporting: false,
      },
      buildFlags: {
        sourcemap: true,
        minify: false,
        cache: true,
      },
      cdn: {
        enabled: false,
      },
    },

    staging: {
      name: 'staging',
      apiUrl: process.env.STAGING_API_URL || 'https://staging-api.hyperfy.io',
      logLevel: 'info',
      features: {
        devTools: false,
        debugGlobals: false,
        performanceMonitoring: true,
        errorReporting: true,
      },
      buildFlags: {
        sourcemap: true,
        minify: true,
        cache: true,
      },
      cdn: {
        enabled: true,
        domain: process.env.STAGING_CDN_DOMAIN || 'staging-cdn.hyperfy.io',
      },
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        endpoints: ['/health', '/api/health'],
      },
    },

    production: {
      name: 'production',
      apiUrl: process.env.PROD_API_URL || 'https://api.hyperfy.io',
      logLevel: 'warn',
      features: {
        devTools: false,
        debugGlobals: false,
        performanceMonitoring: true,
        errorReporting: true,
      },
      buildFlags: {
        sourcemap: false,
        minify: true,
        cache: true,
      },
      cdn: {
        enabled: true,
        domain: process.env.PROD_CDN_DOMAIN || 'cdn.hyperfy.io',
      },
      caching: {
        maxAge: 31536000,
        staticMaxAge: 86400,
      },
      healthCheck: {
        enabled: true,
        interval: 60000,
        timeout: 10000,
        endpoints: ['/health', '/api/health'],
        alertOnFailure: true,
      },
      rateLimit: {
        enabled: true,
        requests: 1000,
        window: 60000,
      },
    },
  },

  deployment: {
    rollbackOnFailure: true,
    maxRetries: 3,
    retryDelay: 5000,
    healthCheckDelay: 10000,
    artifactRetention: {
      development: 7,
      staging: 30,
      production: 90,
    },
    notifications: {
      enabled: true,
      channels: ['slack', 'email'],
      onSuccess: true,
      onFailure: true,
    },
  },

  bundleSize: {
    client: {
      warn: 1024 * 400,
      error: 1024 * 600,
    },
    server: {
      warn: 1024 * 500,
      error: 1024 * 800,
    },
  },

  buildPipeline: {
    client: {
      entryPoints: ['src/client/index.js', 'src/client/particles.js'],
      platform: 'browser',
      format: 'esm',
      targets: ['es2020'],
    },
    server: {
      entryPoints: ['src/server/index.js'],
      platform: 'node',
      format: 'esm',
      targets: ['node22'],
    },
    viewer: {
      entryPoints: ['src/viewer/index.js'],
      platform: 'browser',
      format: 'esm',
      targets: ['es2020'],
    },
  },

  preDeploymentChecks: {
    linting: true,
    bundleSize: true,
    secretsCheck: true,
    importValidation: true,
    consoleLogCheck: true,
    buildArtifactCheck: true,
    dependencyCheck: true,
  },

  metrics: {
    trackingEnabled: true,
    metrics: [
      'buildTime',
      'bundleSize',
      'deploymentDuration',
      'healthCheckLatency',
      'errorRate',
    ],
  },
}
