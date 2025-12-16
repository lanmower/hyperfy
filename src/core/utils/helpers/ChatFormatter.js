// ChatFormatter.js - Chat message formatting utilities

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi
]

export function sanitizeText(text) {
  if (typeof text !== 'string') return ''

  let sanitized = text

  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return sanitized
}

export function formatTimestamp(timestamp, format = 'time') {
  const date = new Date(timestamp)

  switch (format) {
    case 'time':
      return date.toLocaleTimeString()
    case 'datetime':
      return date.toLocaleString()
    case 'iso':
      return date.toISOString()
    case 'relative':
      return formatRelativeTime(timestamp)
    default:
      return date.toLocaleTimeString()
  }
}

export function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 10) return 'now'
  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function detectMentions(text) {
  if (!text) return []
  const mentionRegex = /@(\w+)/g
  const mentions = []
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}

export function highlightMentions(text, currentUserId) {
  if (!text) return text
  return text.replace(/@(\w+)/g, (match, username) => {
    if (username === currentUserId) {
      return `<span class="mention-self">${match}</span>`
    }
    return `<span class="mention">${match}</span>`
  })
}

export function formatRankName(rank) {
  switch (rank) {
    case 2: return 'Admin'
    case 1: return 'Builder'
    default: return 'Visitor'
  }
}

export function formatMessage(message, options = {}) {
  const {
    includeTimestamp = true,
    includeRank = true,
    timestampFormat = 'time',
    sanitize = true
  } = options

  const timestamp = includeTimestamp ? `[${formatTimestamp(message.timestamp, timestampFormat)}] ` : ''
  const rankName = formatRankName(message.rank)
  const rank = includeRank && rankName !== 'Visitor' ? `[${rankName}] ` : ''
  const text = sanitize ? sanitizeText(message.text) : message.text

  return `${timestamp}${rank}${message.name}: ${text}`
}

export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function parseCommand(text) {
  if (!text || !text.startsWith('/')) return null

  const parts = text.slice(1).split(/\s+/).filter(Boolean)
  return {
    command: parts[0],
    args: parts.slice(1)
  }
}

export function isCommand(text) {
  return text && text.startsWith('/')
}

export function highlightLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

export function formatSystemMessage(text) {
  return `[System] ${text}`
}
