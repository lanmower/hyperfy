
import * as THREE from '../../extras/three.js'
import { bindRotations } from '../../extras/bindRotations.js'
import { buttons } from '../../extras/buttons.js'

const controlTypes = {
  mouseLeft: createButton,
  mouseRight: createButton,
  touchStick: createVector,
  scrollDelta: createValue,
  pointer: createPointer,
  screen: createScreen,
  camera: createCamera,
  xrLeftStick: createVector,
  xrLeftTrigger: createButton,
  xrLeftBtn1: createButton,
  xrLeftBtn2: createButton,
  xrRightStick: createVector,
  xrRightTrigger: createButton,
  xrRightBtn1: createButton,
  xrRightBtn2: createButton,
  touchA: createButton,
  touchB: createButton,
}

export function createControlEntry(controls, control, prop) {
  if (prop in control.entries) {
    return control.entries[prop]
  }
  if (buttons.has(prop)) {
    control.entries[prop] = createButton(controls, control, prop)
    return control.entries[prop]
  }
  const createType = controlTypes[prop]
  if (createType) {
    control.entries[prop] = createType(controls, control, prop)
    return control.entries[prop]
  }
  return undefined
}

function createButton(controls, control, prop) {
  const down = controls.buttonsDown.has(prop)
  const pressed = down
  const released = false
  return {
    $button: true,
    down,
    pressed,
    released,
    capture: false,
    onPress: null,
    onRelease: null,
  }
}

function createVector(controls, control, prop) {
  return {
    $vector: true,
    value: new THREE.Vector3(),
    capture: false,
  }
}

function createValue(controls, control, prop) {
  return {
    $value: true,
    value: null,
    capture: false,
  }
}

function createPointer(controls, control, prop) {
  const coords = new THREE.Vector3()
  const position = new THREE.Vector3()
  const delta = new THREE.Vector3()
  return {
    get coords() {
      return coords.copy(controls.pointer.coords)
    },
    get position() {
      return position.copy(controls.pointer.position)
    },
    get delta() {
      return delta.copy(controls.pointer.delta)
    },
    get locked() {
      return controls.pointer.locked
    },
    lock() {
      controls.inputHandler.lockPointer()
    },
    unlock() {
      controls.inputHandler.unlockPointer()
    },
  }
}

function createScreen(controls, control) {
  return {
    $screen: true,
    get width() {
      return controls.screen.width
    },
    get height() {
      return controls.screen.height
    },
  }
}

function createCamera(controls, control) {
  const world = controls.world
  const position = new THREE.Vector3().copy(world.rig.position)
  const quaternion = new THREE.Quaternion().copy(world.rig.quaternion)
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ').copy(world.rig.rotation)
  bindRotations(quaternion, rotation)
  const zoom = world.camera.position.z
  return {
    $camera: true,
    position,
    quaternion,
    rotation,
    zoom,
    write: false,
  }
}
