export class FileManager {
  constructor(resolveURL) {
    this.files = new Map()
    this.resolveURL = resolveURL
  }

  set(url, file) {
    this.files.set(url, file)
  }

  has(url) {
    url = this.resolveURL(url)
    return this.files.has(url)
  }

  get(url, name) {
    url = this.resolveURL(url)
    const file = this.files.get(url)
    if (!file) return null
    if (name) {
      return new File([file], name, {
        type: file.type,
        lastModified: file.lastModified,
      })
    }
    return file
  }

  async load(url) {
    url = this.resolveURL(url)
    if (this.files.has(url)) {
      return this.files.get(url)
    }
    const resp = await fetch(url)
    const blob = await resp.blob()
    const file = new File([blob], url.split('/').pop(), { type: blob.type })
    this.files.set(url, file)
    return file
  }

  clear() {
    this.files.clear()
  }
}
