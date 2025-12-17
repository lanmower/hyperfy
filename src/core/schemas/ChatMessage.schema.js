
export const MessageTypes = {
  NORMAL: 'normal',
  SYSTEM: 'system',
  ACTION: 'action',
  EMOTE: 'emote',
  COMMAND: 'command'
}

export const MessageTypesLegacy = {
  CHAT: 'chat'
}

export function createMessage(data) {
  const now = Date.now()
  const nowISO = new Date(now).toISOString()

  return {
    id: data.id || generateId(),
    userId: data.userId || data.networkId || data.fromId || 'unknown',
    name: data.name || data.from || 'Unknown',
    text: data.text || data.message || data.body || '',
    type: normalizeType(data.type),
    timestamp: normalizeTimestamp(data.timestamp || data.createdAt || now),
    isSystem: data.isSystem || data.from === null || false,
    isPrivate: data.isPrivate || false,
    rank: data.rank || 0,
    mentions: extractMentions(data.text || data.message || data.body || ''),
    metadata: data.metadata || {}
  }
}

export function normalizeMessage(messageData) {
  return createMessage(messageData)
}

export function validateMessage(message) {
  const errors = []

  if (!message.id) errors.push('Message must have an id')
  if (!message.userId) errors.push('Message must have a userId')
  if (!message.name) errors.push('Message must have a name')
  if (typeof message.text !== 'string') errors.push('Message text must be a string')
  if (!Object.values(MessageTypes).concat(Object.values(MessageTypesLegacy)).includes(message.type)) {
    errors.push(`Invalid message type: ${message.type}`)
  }
  if (typeof message.timestamp !== 'number') errors.push('Message timestamp must be a number')
  if (typeof message.isSystem !== 'boolean') errors.push('Message isSystem must be a boolean')
  if (typeof message.isPrivate !== 'boolean') errors.push('Message isPrivate must be a boolean')
  if (typeof message.rank !== 'number') errors.push('Message rank must be a number')
  if (!Array.isArray(message.mentions)) errors.push('Message mentions must be an array')
  if (typeof message.metadata !== 'object' || message.metadata === null) {
    errors.push('Message metadata must be an object')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function isValidMessage(message) {
  return validateMessage(message).valid
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function normalizeType(type) {
  if (!type) return MessageTypes.NORMAL

  const typeMap = {
    chat: MessageTypes.NORMAL,
    normal: MessageTypes.NORMAL,
    system: MessageTypes.SYSTEM,
    action: MessageTypes.ACTION,
    emote: MessageTypes.EMOTE,
    command: MessageTypes.COMMAND
  }

  return typeMap[type.toLowerCase()] || MessageTypes.NORMAL
}

function normalizeTimestamp(timestamp) {
  if (typeof timestamp === 'number') return timestamp
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp).getTime()
    return isNaN(parsed) ? Date.now() : parsed
  }
  return Date.now()
}

function extractMentions(text) {
  if (!text) return []
  const mentionRegex = /@(\w+)/g
  const mentions = []
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}

export function serializeForNetwork(message) {
  return {
    id: message.id,
    from: message.name,
    fromId: message.userId,
    body: message.text,
    createdAt: new Date(message.timestamp).toISOString()
  }
}

export function deserializeFromNetwork(networkMessage) {
  return createMessage({
    id: networkMessage.id,
    name: networkMessage.from,
    userId: networkMessage.fromId,
    text: networkMessage.body,
    timestamp: networkMessage.createdAt
  })
}
