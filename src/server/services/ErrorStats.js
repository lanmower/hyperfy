import { ErrorLevels } from '../../core/schemas/ErrorEvent.schema.js'

export class ErrorStats {
  static compute(storage, patternTracker) {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneHourAgo = now - (60 * 60 * 1000)

    const recent = storage.errors.filter(e => e.timestamp >= oneMinuteAgo)
    const hourly = storage.errors.filter(e => e.timestamp >= oneHourAgo)

    const byLevel = {}
    const byCategory = {}
    const byClient = {}

    recent.forEach(error => {
      byLevel[error.level] = (byLevel[error.level] || 0) + 1
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
      byClient[error.clientId] = (byClient[error.clientId] || 0) + 1
    })

    const topPatterns = patternTracker.getTopPatterns(10, 60 * 60 * 1000)
    const criticalCount = this.getCriticalCount(recent)

    return {
      total: storage.errors.length,
      lastMinute: recent.length,
      lastHour: hourly.length,
      byLevel,
      byCategory,
      byClient: Object.keys(byClient).length,
      errors: byLevel[ErrorLevels.ERROR] || 0,
      warnings: byLevel[ErrorLevels.WARN] || 0,
      critical: criticalCount,
      topPatterns,
      activeClients: storage.getClientCount()
    }
  }

  static getCriticalCount(errors) {
    return errors.filter(e => {
      return e.level === ErrorLevels.ERROR && (
        e.category.includes('fatal') ||
        e.category.includes('critical') ||
        e.category.includes('crash')
      )
    }).length
  }

  static formatSummary(data) {
    let output = 'ERROR OBSERVATION SUMMARY\n'
    output += '═'.repeat(80) + '\n\n'

    output += `Total Errors: ${data.stats.total}\n`
    output += `Last Minute: ${data.stats.lastMinute}\n`
    output += `Last Hour: ${data.stats.lastHour}\n`
    output += `Active Clients: ${data.stats.activeClients}\n\n`

    output += 'By Level:\n'
    Object.entries(data.stats.byLevel).forEach(([level, count]) => {
      output += `  ${level}: ${count}\n`
    })
    output += '\n'

    output += 'By Category:\n'
    Object.entries(data.stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cat, count]) => {
        output += `  ${cat}: ${count}\n`
      })
    output += '\n'

    if (data.patterns.length > 0) {
      output += 'Top Error Patterns:\n'
      data.patterns.slice(0, 5).forEach((pattern, i) => {
        output += `  ${i + 1}. ${pattern.message.substring(0, 60)}\n`
        output += `     Count: ${pattern.count}, Clients: ${pattern.affectedClients}\n`
      })
    }

    return output
  }
}
