import React from 'react'
import { useState } from 'react'
import { FieldVec3 } from '../Fields.js'
import { DEG2RAD, RAD2DEG } from '../../../core/extras/general.js'
import * as THREE from '../../../core/extras/three.js'

const e1 = new THREE.Euler()
const q1 = new THREE.Quaternion()

export function AppTransformFields({ app }) {
  const [position, setPosition] = useState(app.root.position.toArray())
  const [rotation, setRotation] = useState(app.root.rotation.toArray().map(n => n * RAD2DEG))
  const [scale, setScale] = useState(app.root.scale.toArray())

  return (
    <>
      <FieldVec3
        label='Position'
        dp={1}
        step={0.1}
        bigStep={1}
        value={position}
        onChange={value => {
          setPosition(value)
          app.modify({ position: value })
          app.world.network.send('entityModified', { id: app.data.id, position: value })
        }}
      />
      <FieldVec3
        label='Rotation'
        dp={1}
        step={1}
        bigStep={5}
        value={rotation}
        onChange={value => {
          setRotation(value)
          value = q1.setFromEuler(e1.fromArray(value.map(n => n * DEG2RAD))).toArray()
          app.modify({ quaternion: value })
          app.world.network.send('entityModified', { id: app.data.id, quaternion: value })
        }}
      />
      <FieldVec3
        label='Scale'
        dp={1}
        step={0.1}
        bigStep={1}
        value={scale}
        onChange={value => {
          setScale(value)
          app.modify({ scale: value })
          app.world.network.send('entityModified', { id: app.data.id, scale: value })
        }}
      />
    </>
  )
}
