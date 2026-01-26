export function transformJsx(code) {
  if (!code || typeof code !== 'string') return code
  if (!code.includes('<')) return code

  let result = code
  result = result.replace(/import\s+React\s+from\s+['"]react['"]/g, "import React from 'react'")

  result = result.replace(/<>\s*/g, '<>')
  result = result.replace(/<\/>/g, '</>')

  result = result.replace(/<(\w+)([^>]*)\/>/g, (match, tag, attrs) => {
    if (tag[0] === tag[0].toUpperCase()) {
      return `React.createElement(${tag},${formatAttrs(attrs) || 'null'})`
    }
    return `React.createElement('${tag}',${formatAttrs(attrs) || 'null'})`
  })

  result = result.replace(/<(\/?)(\w+)([^>]*)>/g, (match, isClose, tag, attrs) => {
    if (isClose === '/') {
      return ')'
    }
    if (tag[0] === tag[0].toUpperCase()) {
      return `React.createElement(${tag},${formatAttrs(attrs) || 'null'},`
    }
    return `React.createElement('${tag}',${formatAttrs(attrs) || 'null'},`
  })

  return result
}

function formatAttrs(str) {
  str = str.trim()
  if (!str) return null
  if (str.startsWith('{') && str.endsWith('}')) return str
  if (!str.includes('=')) return null

  const attrs = {}
  const regex = /(\w+)=["']([^"']*)["']|(\w+)={([^}]*?)}/g
  let match
  while ((match = regex.exec(str)) !== null) {
    if (match[1]) {
      attrs[match[1]] = `"${match[2]}"`
    } else if (match[3]) {
      attrs[match[3]] = match[4]
    }
  }

  const keys = Object.keys(attrs)
  if (!keys.length) return null
  return '{' + keys.map(k => `${k}: ${attrs[k]}`).join(', ') + '}'
}
