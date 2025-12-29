const clientFlags = new Map()
let userId = null

export function initClientFeatureFlags(userIdParam, flagsFromServer = {}) {
  userId = userIdParam

  for (const [key, value] of Object.entries(flagsFromServer)) {
    clientFlags.set(key, {
      enabled: value.enabled,
      rollout: value.rollout,
      description: value.description,
      variant: null,
    })
  }
}

export function isFeatureEnabled(flagName) {
  const flag = clientFlags.get(flagName)
  if (!flag) {
    return false
  }

  if (flag.variant !== null) {
    return flag.variant === 'treatment'
  }

  if (!flag.enabled) {
    return false
  }

  if (flag.rollout === 100) {
    flag.variant = 'treatment'
    return true
  }

  if (flag.rollout === 0) {
    flag.variant = 'control'
    return false
  }

  if (!userId) {
    flag.variant = 'control'
    return false
  }

  const hash = hashUserId(userId)
  const bucket = hash % 100
  const enabled = bucket < flag.rollout

  flag.variant = enabled ? 'treatment' : 'control'
  return enabled
}

function hashUserId(uid) {
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getVariant(flagName) {
  const flag = clientFlags.get(flagName)
  if (!flag) {
    return 'control'
  }

  isFeatureEnabled(flagName)

  return flag.variant || 'control'
}

export function getAllFlags() {
  const result = {}
  for (const [key, value] of clientFlags.entries()) {
    result[key] = {
      enabled: value.enabled,
      rollout: value.rollout,
      description: value.description,
      variant: value.variant,
    }
  }
  return result
}

export function updateFlags(flagsFromServer) {
  for (const [key, value] of Object.entries(flagsFromServer)) {
    if (clientFlags.has(key)) {
      const existing = clientFlags.get(key)
      existing.enabled = value.enabled
      existing.rollout = value.rollout
      existing.description = value.description
      existing.variant = null
    } else {
      clientFlags.set(key, {
        enabled: value.enabled,
        rollout: value.rollout,
        description: value.description,
        variant: null,
      })
    }
  }
}

export function createDebugUI() {
  if (typeof window === 'undefined') {
    return
  }

  const container = document.createElement('div')
  container.id = 'feature-flags-debug'
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    max-width: 300px;
    z-index: 99999;
    display: none;
  `

  const title = document.createElement('div')
  title.textContent = 'Feature Flags'
  title.style.cssText = 'font-weight: bold; margin-bottom: 10px; font-size: 14px;'
  container.appendChild(title)

  const flagList = document.createElement('div')
  container.appendChild(flagList)

  function updateUI() {
    flagList.innerHTML = ''
    const flags = getAllFlags()

    for (const [key, value] of Object.entries(flags)) {
      const flagItem = document.createElement('div')
      flagItem.style.cssText = 'margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;'

      const name = document.createElement('div')
      name.textContent = key
      name.style.cssText = 'font-weight: bold;'
      flagItem.appendChild(name)

      const status = document.createElement('div')
      status.textContent = `Variant: ${value.variant || 'unknown'} (${value.rollout}% rollout)`
      status.style.cssText = `color: ${value.variant === 'treatment' ? '#4ade80' : '#94a3b8'};`
      flagItem.appendChild(status)

      flagList.appendChild(flagItem)
    }
  }

  updateUI()

  document.body.appendChild(container)

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      container.style.display = container.style.display === 'none' ? 'block' : 'none'
      if (container.style.display === 'block') {
        updateUI()
      }
    }
  })

  return {
    show: () => {
      container.style.display = 'block'
      updateUI()
    },
    hide: () => {
      container.style.display = 'none'
    },
    update: updateUI,
  }
}
