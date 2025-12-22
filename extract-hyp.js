import fs from 'fs'

const buffer = fs.readFileSync('./src/world/scene.hyp')
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
const view = new DataView(arrayBuffer)

const headerSize = view.getUint32(0, true)
const bytes = new Uint8Array(buffer.slice(4, 4 + headerSize))
const header = JSON.parse(new TextDecoder().decode(bytes))

console.log('=== BLUEPRINT ===')
console.log(JSON.stringify(header.blueprint, null, 2))

if (header.assets) {
  console.log('\n=== ASSETS ===')
  header.assets.forEach(asset => {
    console.log(`${asset.type}: ${asset.url} (${asset.size} bytes)`)
  })

  // Extract script content
  let position = 4 + headerSize
  for (const assetInfo of header.assets) {
    if (assetInfo.type === 'script') {
      const data = buffer.slice(position, position + assetInfo.size)
      const scriptText = new TextDecoder().decode(data)
      console.log('\n=== SCRIPT CONTENT ===')
      console.log(scriptText)
      break
    }
    position += assetInfo.size
  }
}
