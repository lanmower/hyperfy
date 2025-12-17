export class FileManager {
  constructor(loader) {
    this.loader = loader
    this.files = new Map()
  }

  setFile(url, file) {
    this.files.set(url, file)
  }

  hasFile(url) {
    url = this.loader.resolveURL(url)
    return this.files.has(url)
  }

  getFile(url, name) {
    url = this.loader.resolveURL(url)
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

  async loadFile(url) {
    url = this.loader.resolveURL(url)
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
