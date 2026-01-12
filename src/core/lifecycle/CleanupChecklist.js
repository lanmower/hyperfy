import { CleanupChecklist } from './CleanupChecklistRegistry.js'
import { CleanupChecklistPart2 } from './CleanupChecklistValidator.js'

export function printCleanupGuide(category) {
  const allGuides = { ...CleanupChecklist, ...CleanupChecklistPart2 }
  const guide = allGuides[category]
  if (!guide) {
    return 'Unknown category. Available: ' + Object.keys(allGuides).join(', ')
  }

  let output = `\n=== ${guide.name} ===\n\n`

  if (guide.items) {
    output += 'Checklist:\n'
    guide.items.forEach((item, i) => {
      output += `${i + 1}. ${item}\n`
    })
  }

  if (guide.questions) {
    output += '\nQuestions to ask:\n'
    guide.questions.forEach((q, i) => {
      output += `${i + 1}. ${q}\n`
    })
  }

  if (guide.template) {
    output += `\nTemplate:\n${guide.template}\n`
  }

  return output
}
