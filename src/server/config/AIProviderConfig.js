// Consolidated: Re-export AI provider configuration from ServerConstants
import { ServerConstants } from './Constants.js'

export const AIProviderConfig = {
  providers: ServerConstants.AI_PROVIDERS,
  healthCheck: ServerConstants.AI_HEALTH_CHECK,
}

export default AIProviderConfig
