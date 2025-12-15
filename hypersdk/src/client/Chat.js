import { normalizeMessage, MessageTypes } from '../../../src/core/schemas/ChatMessage.schema.js'
import { formatMessage as formatMsg, formatRankName } from '../../../src/core/utils/ChatFormatter.js'

export class Chat {
  constructor(client) {
    this.client = client
    this.messages = []
    this.maxMessages = 100
    this.onMessage = null
    this.onCleared = null
  }

  sendMessage(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Message text must be a non-empty string')
    }

    if (text.length > 500) {
      throw new Error('Message text cannot exceed 500 characters')
    }

    return this.client.send('command', ['chat', text])
  }

  sendCommand(command, ...args) {
    return this.client.send('command', [command, ...args])
  }

  getMessages(limit = null) {
    if (limit && limit > 0) {
      return this.messages.slice(-limit)
    }
    return [...this.messages]
  }

  getLastMessage() {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null
  }

  getMessagesByUser(userId) {
    return this.messages.filter(msg => msg.userId === userId)
  }

  getMessagesByType(type) {
    return this.messages.filter(msg => msg.type === type)
  }

  searchMessages(query, caseSensitive = false) {
    const searchQuery = caseSensitive ? query : query.toLowerCase()
    return this.messages.filter(msg => {
      const text = caseSensitive ? msg.text : msg.text.toLowerCase()
      return text.includes(searchQuery)
    })
  }

  getMessageCount() {
    return this.messages.length
  }

  clear() {
    this.messages = []
    this.client.emit('chatCleared')
    if (this.onCleared) {
      this.onCleared()
    }
  }

  addMessage(messageData) {
    const message = normalizeMessage(messageData)

    this.messages.push(message)

    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }

    this.client.emit('chatMessage', message)
    if (this.onMessage) {
      this.onMessage(message)
    }

    return message
  }

  formatMessage(message, includeTimestamp = true) {
    return formatMsg(message, { includeTimestamp })
  }

  getRecentMessages(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.messages.filter(msg => msg.timestamp >= cutoff)
  }

  getMessageStats() {
    const userCounts = {}
    const typeCounts = {}

    this.messages.forEach(msg => {
      userCounts[msg.userId] = (userCounts[msg.userId] || 0) + 1
      typeCounts[msg.type] = (typeCounts[msg.type] || 0) + 1
    })

    return {
      totalMessages: this.messages.length,
      uniqueUsers: Object.keys(userCounts).length,
      messagesByUser: userCounts,
      messagesByType: typeCounts,
      oldestMessage: this.messages.length > 0 ? this.messages[0].timestamp : null,
      newestMessage: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null
    }
  }

  getRankName(rank) {
    return formatRankName(rank)
  }

  // Export/Import
  exportMessages(format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.messages, null, 2)
      case 'text':
        return this.messages.map(msg => this.formatMessage(msg)).join('\n')
      case 'csv':
        if (this.messages.length === 0) return 'timestamp,name,text,type,rank\n'
        return 'timestamp,name,text,type,rank\n' +
               this.messages.map(msg =>
                 `${new Date(msg.timestamp).toISOString()},${msg.name},${msg.text},${msg.type},${msg.rank}`
               ).join('\n')
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // Configuration
  setMaxMessages(max) {
    if (max < 1) throw new Error('Max messages must be at least 1')
    this.maxMessages = max

    // Trim existing messages if needed
    if (this.messages.length > max) {
      this.messages = this.messages.slice(-max)
    }
  }

  getMaxMessages() {
    return this.maxMessages
  }

  // Events
  on(event, callback) {
    switch (event) {
      case 'message':
        this.onMessage = callback
        break
      case 'cleared':
        this.onCleared = callback
        break
      default:
        throw new Error(`Unknown chat event: ${event}`)
    }
  }

  off(event) {
    switch (event) {
      case 'message':
        this.onMessage = null
        break
      case 'cleared':
        this.onCleared = null
        break
      default:
        throw new Error(`Unknown chat event: ${event}`)
    }
  }

  // Debug
  toString() {
    return `Chat(${this.messages.length} messages, ${this.getMaxMessages()} max)`
  }
}