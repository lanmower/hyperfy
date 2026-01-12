import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('FileExtractor')

export class FileExtractor {
  async extractFromDrop(e) {
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]

      if (item.kind === 'file') {
        return item.getAsFile()
      }

      if (item.type === 'text/uri-list' || item.type === 'text/plain' || item.type === 'text/html') {
        const text = await this.getAsString(item)
        const url = text.trim().split('\n')[0]

        if (url.startsWith('http')) {
          try {
            const resp = await fetch(url)
            if (!resp.ok) {
              throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`)
            }
            const blob = await resp.blob()
            const filename = new URL(url).pathname.split('/').pop()
            return new File([blob], filename, { type: resp.headers.get('content-type') })
          } catch (err) {
            logger.error('Failed to fetch URL', { url, error: err.message })
            return null
          }
        }
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      return e.dataTransfer.files[0]
    }

    return null
  }

  getAsString(item) {
    return new Promise(resolve => {
      item.getAsString(resolve)
    })
  }
}
