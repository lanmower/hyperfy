import { hashFile } from '../../utils-client.js'

export class ClientUploadManager {
  constructor(network) {
    this.network = network
  }

  async upload(file) {
    const hash = await hashFile(file)
    const ext = file.name.split('.').pop().toLowerCase()
    const filename = `${hash}.${ext}`
    const url = `${this.network.apiUrl}/upload-check?filename=${filename}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data.exists) return

    const form = new FormData()
    form.append('file', file)
    const uploadUrl = `${this.network.apiUrl}/upload`
    await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    })
  }
}
