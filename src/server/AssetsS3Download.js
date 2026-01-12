let HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand

try {
  const s3Module = await import('@aws-sdk/client-s3')
  HeadObjectCommand = s3Module.HeadObjectCommand
  ListObjectsV2Command = s3Module.ListObjectsV2Command
  DeleteObjectsCommand = s3Module.DeleteObjectsCommand
} catch (error) {
  console.error('[AssetsS3] AWS SDK not available')
}

export class AssetsS3Download {
  constructor(client, bucketName, prefix) {
    this.client = client
    this.bucketName = bucketName
    this.prefix = prefix
  }

  async init() {
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
}
