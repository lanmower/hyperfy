import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PrimProxy')

export function createPrimProxy(prim, nodeProxy) {
  const self = prim
  const proxy = {
    get type() {
      return self.type
    },
    set type(value) {
      self.type = value
    },
    get size() {
      return self.size
    },
    set size(value) {
      self.size = value
    },
    get color() {
      return self.color
    },
    set color(value) {
      self.color = value
    },
    get emissive() {
      return self.emissive
    },
    set emissive(value) {
      self.emissive = value
    },
    get emissiveIntensity() {
      return self.emissiveIntensity
    },
    set emissiveIntensity(value) {
      self.emissiveIntensity = value
    },
    get metalness() {
      return self.metalness
    },
    set metalness(value) {
      self.metalness = value
    },
    get roughness() {
      return self.roughness
    },
    set roughness(value) {
      self.roughness = value
    },
    get opacity() {
      return self.opacity
    },
    set opacity(value) {
      self.opacity = value
    },
    get transparent() {},
    set transparent(value) {
      logger.warn('prim.transparent is deprecated', {})
    },
    get texture() {
      return self.texture
    },
    set texture(value) {
      self.texture = value
    },
    get castShadow() {
      return self.castShadow
    },
    set castShadow(value) {
      self.castShadow = value
    },
    get receiveShadow() {
      return self.receiveShadow
    },
    set receiveShadow(value) {
      self.receiveShadow = value
    },
    get physics() {
      return self.physics
    },
    set physics(value) {
      self.physics = value
    },
    get mass() {
      return self.mass
    },
    set mass(value) {
      self.mass = value
    },
    get linearDamping() {
      return self.linearDamping
    },
    set linearDamping(value) {
      self.linearDamping = value
    },
    get angularDamping() {
      return self.angularDamping
    },
    set angularDamping(value) {
      self.angularDamping = value
    },
    get staticFriction() {
      return self.staticFriction
    },
    set staticFriction(value) {
      self.staticFriction = value
    },
    get dynamicFriction() {
      return self.dynamicFriction
    },
    set dynamicFriction(value) {
      self.dynamicFriction = value
    },
    get restitution() {
      return self.restitution
    },
    set restitution(value) {
      self.restitution = value
    },
    get layer() {
      return self.layer
    },
    set layer(value) {
      self.layer = value
    },
    get trigger() {
      return self.trigger
    },
    set trigger(value) {
      self.trigger = value
    },
    get tag() {
      return self.tag
    },
    set tag(value) {
      self.tag = value
    },
    get onContactStart() {
      return self.onContactStart
    },
    set onContactStart(value) {
      self.onContactStart = value
    },
    get onContactEnd() {
      return self.onContactEnd
    },
    set onContactEnd(value) {
      self.onContactEnd = value
    },
    get onTriggerEnter() {
      return self.onTriggerEnter
    },
    set onTriggerEnter(value) {
      self.onTriggerEnter = value
    },
    get onTriggerLeave() {
      return self.onTriggerLeave
    },
    set onTriggerLeave(value) {
      self.onTriggerLeave = value
    },
    get doubleside() {
      return self.doubleside
    },
    set doubleside(value) {
      self.doubleside = value
    },
  }

  Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(nodeProxy))
  return proxy
}
