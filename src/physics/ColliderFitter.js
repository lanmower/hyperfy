import { extractMeshFromGLB } from './GLBLoader.js'

export class ColliderFitter {
  static analyzeMesh(glbPath, meshIndex = 0) {
    const mesh = extractMeshFromGLB(glbPath, meshIndex)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < mesh.vertices.length; i += 3) {
      minX = Math.min(minX, mesh.vertices[i]); maxX = Math.max(maxX, mesh.vertices[i])
      minY = Math.min(minY, mesh.vertices[i+1]); maxY = Math.max(maxY, mesh.vertices[i+1])
      minZ = Math.min(minZ, mesh.vertices[i+2]); maxZ = Math.max(maxZ, mesh.vertices[i+2])
    }
    const w = maxX - minX, h = maxY - minY, d = maxZ - minZ
    return {
      name: mesh.name,
      triangles: mesh.triangleCount,
      bounds: [minX, minY, minZ, maxX, maxY, maxZ],
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
      size: [w, h, d],
      volume: w * h * d
    }
  }

  static fitBox(analysis) {
    return {
      type: 'box',
      halfExtents: [analysis.size[0] / 2, analysis.size[1] / 2, analysis.size[2] / 2],
      offset: analysis.center
    }
  }

  static fitCapsule(analysis) {
    const [w, h, d] = analysis.size
    const radius = Math.min(w, d) / 2.5
    return {
      type: 'capsule',
      radius,
      halfHeight: h / 2,
      offset: analysis.center
    }
  }

  static fitSphere(analysis) {
    const radius = Math.max(analysis.size[0], analysis.size[1], analysis.size[2]) / 2
    return {
      type: 'sphere',
      radius,
      offset: analysis.center
    }
  }

  static recommend(analysis) {
    const [w, h, d] = analysis.size
    if (w < 0.3 && d < 0.3) return this.fitSphere(analysis)
    if (h > w * 2 && h > d * 2) return this.fitCapsule(analysis)
    return this.fitBox(analysis)
  }
}
