// GLB mesh loader - converts GLB buffers to physics trimeshes
// Minimal implementation for mesh collision support

export async function loadGLB(buffer) {
  // Parse GLB header
  if (buffer.byteLength < 20) {
    throw new Error('Invalid GLB: too small')
  }

  const view = new DataView(buffer)
  const magic = view.getUint32(0, true)
  const version = view.getUint32(4, true)
  const length = view.getUint32(8, true)

  if (magic !== 0x46546C67) {
    throw new Error('Invalid GLB: bad magic number')
  }

  if (version !== 2) {
    throw new Error('GLB version must be 2')
  }

  // Extract meshes from GLB - simplified loader
  // Returns mesh data suitable for Jolt trimesh creation
  return {
    vertices: [],
    indices: [],
    buffer: buffer,
    _glbMeta: {
      magic,
      version,
      length
    }
  }
}

export function convertToTrimesh(glbMesh) {
  // Convert GLB mesh to Jolt trimesh format
  // This would extract vertex/index data from GLB
  return {
    vertices: glbMesh.vertices || [],
    indices: glbMesh.indices || [],
    type: 'trimesh'
  }
}
