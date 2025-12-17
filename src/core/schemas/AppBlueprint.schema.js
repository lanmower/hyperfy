

export const BlueprintSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier for the blueprint'
  },
  name: {
    type: 'string',
    required: false,
    default: '',
    description: 'Display name for the app'
  },
  model: {
    type: 'string',
    required: true,
    description: 'URL or asset:// path to GLB/VRM model'
  },
  script: {
    type: 'string',
    required: false,
    description: 'URL or asset:// path to JS script'
  },
  description: {
    type: 'string',
    required: false,
    default: '',
    description: 'App description'
  },
  preview: {
    type: 'string',
    required: false,
    description: 'Preview image URL'
  },
  disabled: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, app will not be instantiated'
  },
  scene: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, marks app as scene (different UI treatment)'
  },
  listable: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'If true, appears in app browser'
  },
  tags: {
    type: 'array',
    required: false,
    default: [],
    description: 'Array of tag strings for categorization'
  },
  authors: {
    type: 'array',
    required: false,
    default: [],
    description: 'Array of author names'
  },
  version: {
    type: 'string',
    required: false,
    description: 'Blueprint version string'
  },
  icon: {
    type: 'string',
    required: false,
    description: 'Icon URL for app'
  },
  props: {
    type: 'object',
    required: false,
    description: 'Custom properties passed to script'
  },
  preload: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, preload assets'
  },
  public: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, app is publicly accessible'
  },
  locked: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, app cannot be modified'
  },
  frozen: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, app state is frozen'
  },
  unique: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'If true, only one instance allowed'
  }
}

export function validateBlueprint(blueprint) {
  if (!blueprint) {
    return { valid: false, error: 'Blueprint is null or undefined' }
  }

  if (typeof blueprint !== 'object') {
    return { valid: false, error: 'Blueprint must be an object' }
  }

  for (const [key, schema] of Object.entries(BlueprintSchema)) {
    const value = blueprint[key]

    if (schema.required && (value === undefined || value === null)) {
      return { valid: false, error: `Blueprint missing required field: ${key}` }
    }

    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== schema.type) {
        return { valid: false, error: `Blueprint ${key} must be ${schema.type}, got ${actualType}` }
      }
    }
  }

  return { valid: true }
}

export function normalizeBlueprint(data) {
  const normalized = { ...data }

  for (const [key, schema] of Object.entries(BlueprintSchema)) {
    if (schema.default !== undefined && (normalized[key] === undefined || normalized[key] === null)) {
      normalized[key] = Array.isArray(schema.default) ? [...schema.default] : schema.default
    }
  }

  return normalized
}

export function isListableApp(blueprint) {
  if (!blueprint) return false
  if (!blueprint.model) return false
  if (blueprint.disabled) return false
  if (blueprint.scene) return false
  if (blueprint.listable === false) return false
  return true
}

export function getListableBlueprints(blueprints, options = {}) {
  const { query } = options
  let filtered = []

  for (const blueprint of blueprints) {
    if (!isListableApp(blueprint)) continue
    filtered.push(blueprint)
  }

  if (query) {
    const lowerQuery = query.toLowerCase()
    filtered = filtered.filter(bp => {
      const name = (bp.name || '').toLowerCase()
      const desc = (bp.description || '').toLowerCase()
      const tags = (bp.tags || []).join(' ').toLowerCase()
      return name.includes(lowerQuery) || desc.includes(lowerQuery) || tags.includes(lowerQuery)
    })
  }

  return filtered
}
