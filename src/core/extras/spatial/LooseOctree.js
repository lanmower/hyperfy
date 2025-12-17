import { isBoolean } from 'lodash-es'
import * as THREE from './three.js'

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _m1 = new THREE.Matrix4()
const _intersects = []
const _mesh = new THREE.Mesh()

const MIN_RADIUS = 0.2


export class LooseOctree {
  constructor({ scene, center, size }) {
    this.scene = scene
    this.root = new LooseOctreeNode(this, null, center, size)
    this.helper = null
  }

  insert(item) {
    if (!item.sphere) item.sphere = new THREE.Sphere()
    if (!item.geometry.boundingSphere) item.geometry.computeBoundingSphere()
    item.sphere.copy(item.geometry.boundingSphere).applyMatrix4(item.matrix)
    if (item.sphere.radius < MIN_RADIUS) item.sphere.radius = MIN_RADIUS // prevent huge subdivisions
    let added = this.root.insert(item)
    if (!added) {
      while (!this.root.canContain(item)) {
        this.expand()
      }
      added = this.root.insert(item)
    }
    return added
  }

  move(item) {
    if (!item._node) {
      return
    }
    item.sphere.copy(item.geometry.boundingSphere).applyMatrix4(item.matrix)
    if (item._node.canContain(item)) {
      return
    }
    const prevNode = item._node
    this.remove(item)
    const added = this.insert(item)
    if (!added) {
      console.error('octree item moved but was not re-added. did it move outside octree bounds?')
    }
    prevNode.checkCollapse()
  }

  remove(item) {
    item._node?.remove(item)
  }

  expand() {
    let prevRoot
    let size
    let center

    prevRoot = this.root
    size = prevRoot.size * 2
    center = new THREE.Vector3(
      prevRoot.center.x + prevRoot.size,
      prevRoot.center.y + prevRoot.size,
      prevRoot.center.z + prevRoot.size
    )
    const first = new LooseOctreeNode(this, null, center, size)
    first.subdivide()
    first.children[0].destroy()
    first.children[0] = prevRoot
    prevRoot.parent = first
    this.root = first
    this.root.count = prevRoot.count

    prevRoot = this.root
    size = prevRoot.size * 2
    center = new THREE.Vector3(
      prevRoot.center.x - prevRoot.size,
      prevRoot.center.y - prevRoot.size,
      prevRoot.center.z - prevRoot.size
    )
    const second = new LooseOctreeNode(this, null, center, size)
    second.subdivide()
    second.children[7].destroy()
    second.children[7] = prevRoot
    prevRoot.parent = second
    this.root = second
    this.root.count = prevRoot.count
  }

  raycast(raycaster, intersects = []) {
    this.root.raycast(raycaster, intersects)
    intersects.sort(sortAscending)
    return intersects
  }



  toggleHelper(enabled) {
    enabled = isBoolean(enabled) ? enabled : !this.helper
    if (enabled && !this.helper) {
      this.helper = createHelper(this)
      this.helper.init()
    }
    if (!enabled && this.helper) {
      this.helper.destroy()
      this.helper = null
    }
  }

  getDepth() {
    return this.root.getDepth()
  }

  getCount() {
    return this.root.getCount()
  }
}

class LooseOctreeNode {
  constructor(octree, parent, center, size) {
    this.octree = octree
    this.parent = parent
    this.center = center
    this.size = size
    this.inner = new THREE.Box3(
      new THREE.Vector3(center.x - size, center.y - size, center.z - size),
      new THREE.Vector3(center.x + size, center.y + size, center.z + size)
    )
    this.outer = new THREE.Box3(
      new THREE.Vector3(center.x - size * 2, center.y - size * 2, center.z - size * 2), // prettier-ignore
      new THREE.Vector3(center.x + size * 2, center.y + size * 2, center.z + size * 2) // prettier-ignore
    )
    this.items = []
    this.count = 0
    this.children = []
    this.mountHelper()
  }

  insert(item) {
    if (!this.canContain(item)) {
      return false
    }
    if (this.size / 2 < item.sphere.radius) {
      this.items.push(item)
      item._node = this
      this.inc(1)
      return true
    }
    if (!this.children.length) {
      this.subdivide()
    }
    for (const child of this.children) {
      if (child.insert(item)) {
        return true
      }
    }
    console.error('octree insert fail')
    return false
  }

  remove(item) {
    const idx = this.items.indexOf(item)
    this.items.splice(idx, 1)
    item._node = null
    this.dec(1)
  }

  inc(amount) {
    let node = this
    while (node) {
      node.count += amount
      node = node.parent
    }
  }

  dec(amount) {
    let node = this
    while (node) {
      node.count -= amount
      node = node.parent
    }
  }

  canContain(item) {
    return this.size >= item.sphere.radius && this.inner.containsPoint(item.sphere.center)
  }

  checkCollapse() {
    let match
    let node = this
    while (node) {
      if (node.count) break
      if (node.children.length) match = node
      node = node.parent
    }
    match?.collapse()
  }

  collapse() {
    for (const child of this.children) {
      child.collapse()
      child.destroy()
    }
    this.children = []
  }

  subdivide() {
    if (this.children.length) return // Ensure we don't subdivide twice
    const halfSize = this.size / 2
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const center = new THREE.Vector3(
            this.center.x + halfSize * (2 * x - 1),
            this.center.y + halfSize * (2 * y - 1),
            this.center.z + halfSize * (2 * z - 1)
          )
          const child = new LooseOctreeNode(this.octree, this, center, halfSize)
          this.children.push(child)
        }
      }
    }
  }

  raycast(raycaster, intersects) {
    if (!raycaster.ray.intersectsBox(this.outer)) {
      return intersects
    }
    for (const item of this.items) {
      if (raycaster.ray.intersectsSphere(item.sphere)) {
        _mesh.geometry = item.geometry
        _mesh.material = item.material
        _mesh.matrixWorld = item.matrix
        _mesh.raycast(raycaster, _intersects)
        for (let i = 0, l = _intersects.length; i < l; i++) {
          const intersect = _intersects[i]
          intersect.getEntity = item.getEntity
          intersect.node = item.node
          intersect.direction = raycaster.ray.direction
          intersects.push(intersect)
        }
        _intersects.length = 0
      }
    }
    for (const child of this.children) {
      child.raycast(raycaster, intersects)
    }
    return intersects
  }



  getDepth() {
    if (this.children.length === 0) {
      return 1
    }
    return 1 + Math.max(...this.children.map(child => child.getDepth()))
  }

  getCount() {
    let count = 1
    for (const child of this.children) {
      count += child.getCount()
    }
    return count
  }

  mountHelper() {
    this.octree.helper?.insert(this)
  }

  unmountHelper() {
    this.octree.helper?.remove(this)
  }

  destroy() {
    this.unmountHelper()
  }
}

function sortAscending(a, b) {
  return a.distance - b.distance
}


function createHelper(octree) {
  const boxes = new THREE.BoxGeometry(1, 1, 1)
  const edges = new THREE.EdgesGeometry(boxes)
  const geometry = new THREE.InstancedBufferGeometry().copy(edges)
  const iMatrix = new THREE.InstancedBufferAttribute(new Float32Array(1000000 * 16), 16)
  iMatrix.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('iMatrix', iMatrix)
  const offset = new THREE.InstancedBufferAttribute(new Float32Array(100000 * 3), 3)
  geometry.setAttribute('offset', offset)
  const scale = new THREE.InstancedBufferAttribute(new Float32Array(100000 * 3), 3)
  geometry.setAttribute('scale', scale)
  geometry.instanceCount = 0
  const material = new THREE.LineBasicMaterial({
    color: 'red',
    onBeforeCompile: shader => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        attribute mat4 iMatrix;
        #include <common>
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        transformed = (iMatrix * vec4(position, 1.0)).xyz;
        `
      )
    },
  })
  const mesh = new THREE.LineSegments(geometry, material)
  mesh.frustumCulled = false
  const items = []
  function insert(node) {
    const idx = mesh.geometry.instanceCount
    mesh.geometry.instanceCount++
    const position = _v1.copy(node.center)
    const quaternion = _q1.set(0, 0, 0, 1)
    const scale = _v2.setScalar(node.size * 2)
    const matrix = new THREE.Matrix4().compose(position, quaternion, scale)
    iMatrix.set(matrix.elements, idx * 16)
    iMatrix.needsUpdate = true
    node._helperItem = { idx, matrix }
    items.push(node._helperItem)
  }
  function remove(node) {
    const item = node._helperItem
    const last = items[items.length - 1]
    const isOnly = items.length === 1
    const isLast = item === last
    if (isOnly) {
      items.length = 0
      mesh.geometry.instanceCount = 0
    } else if (isLast) {
      items.pop()
      mesh.geometry.instanceCount--
    } else {
      if (!last) {
        console.log(
          'wtf',
          item,
          items.indexOf(item),
          last,
          items.length,
          mesh.geometry.instanceCount,
          items
        )
        throw new Error('wtf')
      }
      iMatrix.set(last.matrix.elements, item.idx * 16)
      last.idx = item.idx
      items[item.idx] = last
      items.pop()
      mesh.geometry.instanceCount--
    }
    iMatrix.needsUpdate = true
  }
  function traverse(node, callback) {
    callback(node)
    for (const child of node.children) {
      traverse(child, callback)
    }
  }
  function destroy() {
    octree.scene.remove(mesh)
  }
  function init() {
    traverse(octree.root, node => {
      node.mountHelper()
    })
  }
  octree.scene.add(mesh)
  return {
    init,
    insert,
    remove,
    destroy,
  }
}
