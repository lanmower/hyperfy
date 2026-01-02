import fs from 'fs-extra'
import path from 'path'
import { hashFile } from '../core/utils.js'

let S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand

try {
  const s3Module = await import('@aws-sdk/client-s3')
  S3Client = s3Module.S3Client
  PutObjectCommand = s3Module.PutObjectCommand
  HeadObjectCommand = s3Module.HeadObjectCommand
  ListObjectsV2Command = s3Module.ListObjectsV2Command
  DeleteObjectsCommand = s3Module.DeleteObjectsCommand
} catch (error) {
  console.error('[AssetsS3] AWS SDK not available - S3 storage disabled')
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

export class AssetsS3 {
  constructor() {
    if (!S3Client) {
      throw new Error('AWS SDK is not installed. Install @aws-sdk/client-s3 to use S3 storage.')
    }

    const uri = process.env.ASSETS_S3_URI
    if (!uri) {
      throw new Error('ASSETS_S3_URI environment variable is required')
    }

    const config = this.parseURI(uri)
    this.bucketName = config.bucket
    this.prefix = config.prefix || 'assets/'

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    })
  }

  parseURI(uri) {
    try {
      if (!uri.startsWith('s3://')) {
        throw new Error('S3 URI must start with s3://')
      }

      const withoutProtocol = uri.slice(5)
      const credentialsMatch = withoutProtocol.match(/^([^:]+):([^@]+)@(.+)$/)
      if (!credentialsMatch) {
        throw new Error('Invalid S3 URI format')
      }

      const [, accessKeyId, secretAccessKey, rest] = credentialsMatch
      const parts = rest.split('/')
      const host = parts[0]
      const pathParts = parts.slice(1)

      let config = {
        accessKeyId,
        secretAccessKey,
        forcePathStyle: false,
      }

      if (host.includes('.amazonaws.com')) {
        const hostParts = host.split('.')
        const s3Index = hostParts.indexOf('s3')
        if (s3Index === -1) {
          throw new Error('Invalid S3 host: missing "s3" in hostname')
        }
        config.bucket = hostParts.slice(0, s3Index).join('.')
        config.region = hostParts[s3Index + 1] || 'us-east-1'
        config.prefix = pathParts.join('/')
        if (config.prefix && !config.prefix.endsWith('/')) {
          config.prefix += '/'
        }
      } else if (host.includes('.')) {
        config.endpoint = `https://${host}`
        config.bucket = pathParts[0]
        config.prefix = pathParts.slice(1).join('/') + (pathParts.length > 1 ? '/' : '')
        config.region = 'auto'
        config.forcePathStyle = true
      } else {
        config.bucket = host
        config.prefix = pathParts.join('/') + (pathParts.length > 0 ? '/' : '')
        config.region = 'us-east-1'
      }

      return config
    } catch (error) {
      throw new Error(`Failed to parse S3 URI: ${error.message}`)
    }
  }

  async init({ rootDir, worldDir }) {
    console.log('[assets] initializing S3 storage')
    try {
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1,
        })
      )
    } catch (error) {
      throw new Error(`Failed to access S3 bucket: ${error.message}`)
    }

    const builtInDir = path.join(rootDir, 'src/world/assets')
    if (await fs.exists(builtInDir)) {
      await this.uploadDirectory(builtInDir, builtInDir)
    }
  }

  async uploadDirectory(localDir, baseDir, subPath = '') {
    const files = await fs.readdir(localDir)
    for (const file of files) {
      const filePath = path.join(localDir, file)
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        const newSubPath = subPath ? path.join(subPath, file) : file
        await this.uploadDirectory(filePath, baseDir, newSubPath)
      } else {
        const buffer = await fs.readFile(filePath)
        const relativePath = subPath ? path.join(subPath, file) : file
        await this.uploadBuffer(buffer, relativePath)
      }
    }
  }

  async upload(file) {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const hash = await hashFile(buffer)
    const ext = file.name.split('.').pop().toLowerCase()
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

  async list() {
    const assets = new Set()
    let continuationToken = undefined

    do {
      try {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: this.prefix,
            ContinuationToken: continuationToken,
          })
        )

        if (response.Contents) {
          for (const object of response.Contents) {
            const filename = object.Key.replace(this.prefix, '')
            const isAsset = filename.split('.')[0].length === 64
            if (isAsset) {
              assets.add(filename)
            }
          }
        }

        continuationToken = response.NextContinuationToken
      } catch (error) {
        throw new Error(`Failed to list S3 objects: ${error.message}`)
      }
    } while (continuationToken)

    return assets
  }

  async delete(assetList) {
    if (assetList.length === 0) {
      return { success: true, count: 0, removed: 0, freed: 0 }
    }

    const chunks = []
    for (let i = 0; i < assetList.length; i += 1000) {
      chunks.push(assetList.slice(i, i + 1000))
    }

    let removed = 0
    for (const chunk of chunks) {
      const objects = chunk.map(asset => ({
        Key: this.getKey(asset),
      }))

      try {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: objects,
            },
          })
        )
        removed += chunk.length
      } catch (error) {
        throw new Error(`Failed to delete from S3: ${error.message}`)
      }
    }

    return { success: true, count: assetList.length, removed, freed: 0 }
  }

  getKey(filename) {
    return `${this.prefix}${filename}`
  }

  getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    return contentTypes[ext] || 'application/octet-stream'
  }
}
