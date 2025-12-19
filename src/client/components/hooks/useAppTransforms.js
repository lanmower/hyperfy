import { useState } from 'react'
import { DEG2RAD, RAD2DEG } from '../../../core/extras/general.js'
import * as THREE from '../../../core/extras/three.js'

const e1 = new THREE.Euler()
const q1 = new THREE.Quaternion()

export function useAppTransforms(app) {
  const [position, setPosition] = useState(app.root.position.toArray())
  const [rotation, setRotation] = useState(app.root.rotation.toArray().map(n => n * RAD2DEG))
  const [scale, setScale] = useState(app.root.scale.toArray())

  const updatePosition = value => {
    setPosition(value)
    app.modify({ position: value })
    app.world.network.send('entityModified', { id: app.data.id, position: value })
  }

  const updateRotation = value => {
    setRotation(value)
    const quaternion = q1.setFromEuler(e1.fromArray(value.map(n => n * DEG2RAD))).toArray()
    app.modify({ quaternion })
    app.world.network.send('entityModified', { id: app.data.id, quaternion })
  }

  const updateScale = value => {
    setScale(value)
    app.modify({ scale: value })
    app.world.network.send('entityModified', { id: app.data.id, scale: value })
  }

  return {
    position,
    rotation,
    scale,
    updatePosition,
    updateRotation,
    updateScale,
  }
}
