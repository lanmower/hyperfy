import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('PerformanceDashboard')

export class PerformanceDashboard {
  constructor(performanceMonitor) {
    this.performanceMonitor = performanceMonitor
    this.metrics = new Map()
    this.alerts = []
    this.thresholds = new Map()
    this.history = new Map()
    this.maxHistorySize = 100
    this.updateInterval = 5000
    this.lastUpdate = 0
    this.isEnabled = true
  }

  setThreshold(metric, threshold, severity = 'warning') {
    this.thresholds.set(metric, { value: threshold, severity })
    return this
  }

  recordMetric(name, value, metadata = {}) {
    const timestamp = Date.now()
    const metric = {
      name,
      value,
      timestamp,
      metadata,
    }

    this.metrics.set(name, metric)
    this.addToHistory(name, metric)
    this.checkThreshold(name, value)

    return metric
  }

  addToHistory(name, metric) {
    if (!this.history.has(name)) {
      this.history.set(name, [])
    }

    const history = this.history.get(name)
    history.push(metric)

    if (history.length > this.maxHistorySize) {
      history.shift()
    }
  }

  checkThreshold(name, value) {
    const threshold = this.thresholds.get(name)
    if (!threshold) return

    if (value > threshold.value) {
      this.createAlert(name, value, threshold.value, threshold.severity)
    }
  }

  createAlert(metric, value, threshold, severity = 'warning') {
    const alert = {
      id: `${metric}-${Date.now()}`,
      metric,
      value,
      threshold,
      severity,
      timestamp: Date.now(),
      acknowledged: false,
    }

    this.alerts.push(alert)

    if (this.alerts.length > 100) {
      this.alerts.shift()
    }

    logger.warn('Performance threshold exceeded', { metric, value, threshold, severity })

    return alert
  }

  getMetric(name) {
    return this.metrics.get(name) || null
  }

  getAllMetrics() {
    const result = {}
    for (const [name, metric] of this.metrics) {
      result[name] = metric
    }
    return result
  }

  getMetricHistory(name, limit = 20) {
    const history = this.history.get(name) || []
    return history.slice(-limit)
  }

  getMetricStats(name) {
    const history = this.getMetricHistory(name, this.maxHistorySize)
    if (history.length === 0) return null

    const values = history.map(m => m.value)
    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      metric: name,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      current: values[values.length - 1],
    }
  }

  getActiveAlerts() {
    return this.alerts.filter(a => !a.acknowledged)
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  clearAlerts(filter = null) {
    if (!filter) {
      this.alerts = []
      return 0
    }

    const before = this.alerts.length
    this.alerts = this.alerts.filter(a => !filter(a))
    return before - this.alerts.length
  }

  getDashboard() {
    const now = Date.now()
    const dashboard = {
      timestamp: new Date().toISOString(),
      uptime: now,
      metrics: this.getAllMetrics(),
      alerts: this.getActiveAlerts(),
      summary: this.getSummary(),
      trends: this.getTrends(),
    }

    return dashboard
  }

  getSummary() {
    const summary = {
      totalMetrics: this.metrics.size,
      activeAlerts: this.getActiveAlerts().length,
      severityCounts: {
        critical: 0,
        warning: 0,
        info: 0,
      },
      topMetrics: this.getTopMetrics(5),
    }

    for (const alert of this.alerts) {
      if (!alert.acknowledged) {
        summary.severityCounts[alert.severity] = (summary.severityCounts[alert.severity] || 0) + 1
      }
    }

    return summary
  }

  getTrends() {
    const trends = {}

    for (const [name, history] of this.history) {
      if (history.length < 2) continue

      const recent = history.slice(-10)
      const values = recent.map(m => m.value)
      const firstValue = values[0]
      const lastValue = values[values.length - 1]
      const change = lastValue - firstValue
      const changePercent = (change / firstValue) * 100

      trends[name] = {
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        changePercent: changePercent.toFixed(2),
        current: lastValue,
        previous: firstValue,
      }
    }

    return trends
  }

  getTopMetrics(limit = 5) {
    const metrics = Array.from(this.metrics.values())
    return metrics
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map(m => ({
        name: m.name,
        value: m.value,
        metadata: m.metadata,
      }))
  }

  export() {
    return {
      metrics: this.getAllMetrics(),
      alerts: this.alerts,
      history: this.getHistorySnapshot(),
      thresholds: this.getThresholds(),
      summary: this.getSummary(),
    }
  }

  getHistorySnapshot() {
    const snapshot = {}
    for (const [name, history] of this.history) {
      snapshot[name] = history
    }
    return snapshot
  }

  getThresholds() {
    const result = {}
    for (const [name, threshold] of this.thresholds) {
      result[name] = threshold
    }
    return result
  }

  reset() {
    this.metrics.clear()
    this.alerts = []
    this.history.clear()
    this.lastUpdate = 0
  }

  enable() {
    this.isEnabled = true
  }

  disable() {
    this.isEnabled = false
  }
}

export const performanceDashboard = new PerformanceDashboard(null)
