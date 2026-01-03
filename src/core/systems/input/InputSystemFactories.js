import * as THREE from '../../extras/three.js'
import { buttons } from '../../extras/buttons.js'
import { bindRotations } from '../../extras/bindRotations.js'

export function createButton(controls, control, prop) {
  const down = controls.buttonsDown.has(prop)
  return { $button: true, down, pressed: down, released: false, capture: false, onPress: null, onRelease: null }
}

export function createVector() {
  return { $vector: true, value: new THREE.Vector3(), capture: false }
}

export function createValue() {
  return { $value: true, value: null, capture: false }
}

export function createPointer(controls) {
  const coords = new THREE.Vector3()
  const position = new THREE.Vector3()
  const delta = new THREE.Vector3()
  return {
    get coords() { return coords.copy(controls.pointer.coords) },
    get position() { return position.copy(controls.pointer.position) },
    get delta() { return delta.copy(controls.pointer.delta) },
    get locked() { return controls.pointer.locked },
    lock() { controls.lockPointer() },
    unlock() { controls.unlockPointer() },
  }
}

export function createScreen(controls) {
  return {
    $screen: true,
    get width() { return controls.screen.width },
    get height() { return controls.screen.height },
  }
}

export function createCamera(controls) {
  const world = controls.world
  if (!world || !world.camera) return { $camera: true, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), rotation: new THREE.Euler(0, 0, 0, 'YXZ'), zoom: 0, write: false }
  const position = new THREE.Vector3().copy(world.rig.position)
  const quaternion = new THREE.Quaternion().copy(world.rig.quaternion)
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ').copy(world.rig.rotation)
  bindRotations(quaternion, rotation)
  const zoom = world.camera.position.z
  return { $camera: true, position, quaternion, rotation, zoom, write: false }
}

export function buildControlTypes() {
  return {
    mouseLeft: createButton, mouseRight: createButton, touchStick: createVector, scrollDelta: createValue,
    pointer: createPointer, screen: createScreen, camera: createCamera, xrLeftStick: createVector,
    xrLeftTrigger: createButton, xrLeftBtn1: createButton, xrLeftBtn2: createButton, xrRightStick: createVector,
    xrRightTrigger: createButton, xrRightBtn1: createButton, xrRightBtn2: createButton, touchA: createButton, touchB: createButton,
  }
}

export function createControlEntry(controls, control, prop, controlTypes) {
  if (buttons.has(prop)) return createButton(controls, control, prop)
  const createType = controlTypes[prop]
  if (createType) return createType(controls, control, prop)
  return undefined
}
