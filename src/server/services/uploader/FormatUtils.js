export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export function exportStats(stats, format = 'json') {
  if (format === 'json') {
    return JSON.stringify(stats, null, 2)
  }

  if (format === 'csv') {
    const headers = Object.keys(stats).join(',')
    const values = Object.values(stats).join(',')
    return `${headers}\n${values}`
  }

  if (format === 'text') {
    return Object.entries(stats)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  }

  throw new Error(`Unknown export format: ${format}`)
}
