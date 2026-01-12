import { PerformanceBudget } from './PerformanceBudget.js'

export class PerformanceMonitorBudgets {
  constructor() {
    this.violations = []
  }

  checkBudget(result, logger) {
    if (!result.category || !result.path) return

    if (PerformanceBudget.isBudgetExceeded(result.category, result.path, result.duration)) {
      const excess = PerformanceBudget.getExcessAmount(result.category, result.path, result.duration)
      const percent = PerformanceBudget.getExcessPercentage(result.category, result.path, result.duration)
      const budget = PerformanceBudget.getBudget(result.category, result.path)

      const violation = {
        label: result.label,
        category: result.category,
        path: result.path,
        budget,
        actual: result.duration,
        excess,
        percent: percent.toFixed(1),
        timestamp: result.timestamp,
      }

      this.violations.push(violation)

      if (this.violations.length > 100) {
        this.violations.shift()
      }

      if (this.violations.length % 10 === 0) {
        logger.warn('Performance budget exceeded', {
          label: result.label,
          budget: `${budget}ms`,
          actual: `${result.duration.toFixed(2)}ms`,
          excess: `+${excess.toFixed(2)}ms (${percent.toFixed(1)}%)`,
        })
      }
    }
  }

  getViolations(limit = 20) {
    return this.violations.slice(-limit)
  }

  getViolationSummary() {
    const summary = {}
    for (const violation of this.violations) {
      const key = `${violation.category}:${violation.path}`
      if (!summary[key]) {
        summary[key] = {
          category: violation.category,
          path: violation.path,
          budget: violation.budget,
          count: 0,
          maxExcess: 0,
          totalExcess: 0,
        }
      }
      summary[key].count++
      summary[key].maxExcess = Math.max(summary[key].maxExcess, violation.excess)
      summary[key].totalExcess += violation.excess
    }

    return Object.values(summary).sort((a, b) => b.totalExcess - a.totalExcess)
  }

  clear() {
    this.violations = []
  }
}
