let PutObjectCommand

try {
  const s3Module = await import('@aws-sdk/client-s3')
  PutObjectCommand = s3Module.PutObjectCommand
} catch (error) {
  console.error('[AssetsS3] AWS SDK not available')
}

const contentTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  gltf: 'model/gltf+json',
  glb: 'model/gltf-binary',
  obj: 'model/obj',
  json: 'application/json',
  pdf: 'application/pdf',
  zip: 'application/zip',
}

export class AssetsS3Upload {
  constructor(client, prefix) {
    this.client = client
    this.prefix = prefix
  }

  async uploadDirectory(fs, path, localDir, baseDir, subPath = '') {
    const files = await fs.readdir(localDir)
    for (const file of files) {
      const filePath = path.join(localDir, file)
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        const newSubPath = subPath ? path.join(subPath, file) : file
        await this.uploadDirectory(fs, path, filePath, baseDir, newSubPath)
      } else {
        const buffer = await fs.readFile(filePath)
        const relativePath = subPath ? path.join(subPath, file) : file
        await this.uploadBuffer(buffer, relativePath)
      }
    }
  }

  async upload(file, hashFile) {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const hash = await hashFile(buffer)
    const parts = file.name.split('.')
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'bin'
    if (!ext.match(/^[a-z0-9]{1,5}$/)) {
      throw new Error('Invalid file extension')
    }
    const filename = `${hash}.${ext}`
    const exists = await this.exists(filename)
    if (!exists) {
      await this.uploadBuffer(buffer, filename)
    }
    return { hash, filename }
  }

  async uploadBuffer(buffer, filename) {
    const key = this.getKey(filename)
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: this.getContentType(filename),
        })
      )
    } catch (error) {
      throw new Error(`Failed to upload to S3: ${error.message}`)
    }
  }

  async exists(filename) {
    const key = this.getKey(filename)
    try {
      const HeadObjectCommand = (await import('@aws-sdk/client-s3')).HeadObjectCommand
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      )
      return true
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  }

  getKey(filename) {
    return `${this.prefix}${filename}`
  }

  getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    return contentTypes[ext] || 'application/octet-stream'
  }
}
