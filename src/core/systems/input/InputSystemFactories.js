import { buttons } from '../../extras/buttons.js'

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z
  }
  copy(v) {
    this.x = v.x; this.y = v.y; this.z = v.z
    return this
  }
}

class Quat {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x; this.y = y; this.z = z; this.w = w
  }
  copy(q) {
    this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w
    return this
  }
  setFromEuler(euler) {
    const c1 = Math.cos(euler.x / 2);
    const c2 = Math.cos(euler.y / 2);
    const c3 = Math.cos(euler.z / 2);
    const s1 = Math.sin(euler.x / 2);
    const s2 = Math.sin(euler.y / 2);
    const s3 = Math.sin(euler.z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
    return this;
  }
}

export function createButton(controls, control, prop) {
  const down = controls.buttonsDown.has(prop)
  return { $button: true, down, pressed: down, released: false, capture: false, onPress: null, onRelease: null }
}

export function createVector() {
  return { $vector: true, value: new Vec3(), capture: false }
}

export function createValue() {
  return { $value: true, value: null, capture: false }
}

export function createPointer(controls) {
  const coords = new Vec3()
  const position = new Vec3()
  const delta = new Vec3()
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
  if (!world || !world.camera) return { $camera: true, position: new Vec3(), quaternion: new Quat(), rotation: new Vec3(), zoom: 0, write: false }
  const position = new Vec3()
  const quaternion = new Quat()
  const rotation = new Vec3()
  const zoom = 0
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
