export const AIProviderConfig = {
  providers: {
    openai: {
      apiEndpoint: 'https://api.openai.com/v1',
      healthCheckEndpoint: 'https://api.openai.com/v1/models',
      timeout: 30000,
      retryAttempts: 3
    },
    anthropic: {
      apiEndpoint: 'https://api.anthropic.com',
      healthCheckEndpoint: 'https://api.anthropic.com/v1/messages',
      timeout: 30000,
      retryAttempts: 3
    },
    xai: {
      apiEndpoint: 'https://api.x.ai/v1',
      healthCheckEndpoint: 'https://api.x.ai/v1/models',
      timeout: 30000,
      retryAttempts: 3
    },
    google: {
      apiEndpoint: 'https://generativelanguage.googleapis.com',
      healthCheckEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
      timeout: 30000,
      retryAttempts: 3
    }
  },

  healthCheck: {
    interval: 30000,
    timeout: 5000,
    maxRetries: 3,
    circuitBreakerThreshold: 5
  }
}

export default AIProviderConfig
