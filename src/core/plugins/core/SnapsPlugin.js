import * as THREE from 'three'
import { Plugin } from '../Plugin.js'
import { SnapOctree } from '../../extras/SnapOctree.js'

export class SnapsPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.octree = new SnapOctree({
      center: new THREE.Vector3(0, 0, 0),
      size: 10,
    })
  }

  create(position, active) {
    const point = {
      position,
      active,
    }
    this.octree.insert(point)
    const handle = {
      move: () => {
        this.octree.move(point)
      },
      destroy: () => {
        this.octree.remove(point)
      },
    }
    return handle
  }

  getAPI() {
    return {
      create: (position, active) => this.create(position, active),
      getOctree: () => this.octree,
    }
  }
}
