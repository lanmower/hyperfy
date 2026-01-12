import * as THREE from '../../extras/three.js'
import { BaseManager } from '../../patterns/index.js'

function createPool(factory, logger) {
  const pool = []
  return () => {
    if (pool.length) {
      return pool.pop()
    }
    const item = factory(logger)
    item.release = () => pool.push(item)
    return item
  }
}

export class PhysicsCallbackManager extends BaseManager {
  constructor() {
    super(null, 'PhysicsCallbackManager')
    this.contactCallbacks = []
    this.triggerCallbacks = []
    this.getContactCallback = null
    this.getTriggerCallback = null
  }

  initializeCallbacks() {
    this.getContactCallback = createPool((logger) => {
      const contactPool = []
      const contacts = []
      let idx = 0
      return {
        start: false,
        fn0: null,
        event0: {
          tag: null,
          playerId: null,
          contacts,
        },
        fn1: null,
        event1: {
          tag: null,
          playerId: null,
          contacts,
        },
        addContact(position, normal, impulse) {
          if (!contactPool[idx]) {
            contactPool[idx] = {
              position: new THREE.Vector3(),
              normal: new THREE.Vector3(),
              impulse: new THREE.Vector3(),
            }
          }
          const contact = contactPool[idx]
          contact.position.copy(position)
          contact.normal.copy(normal)
          contact.impulse.copy(impulse)
          contacts.push(contact)
          idx++
        },
        init(start) {
          this.start = start
          this.fn0 = null
          this.fn1 = null
          contacts.length = 0
          idx = 0
          return this
        },
        exec() {
          if (this.fn0) {
            try {
              this.fn0(this.event0)
            } catch (err) {
              logger.error('Contact callback execution failed', { error: err.message })
            }
          }
          if (this.fn1) {
            try {
              this.fn1(this.event1)
            } catch (err) {
              logger.error('Contact callback execution failed', { error: err.message })
            }
          }
          this.release()
        },
      }
    }, this.logger)

    this.getTriggerCallback = createPool((logger) => {
      return {
        fn: null,
        event: {
          tag: null,
          playerId: null,
        },
        exec() {
          try {
            this.fn(this.event)
          } catch (err) {
            logger.error('Trigger callback execution failed', { error: err.message })
          }
          this.release()
        },
      }
    }, this.logger)
  }

  queueContactCallback(cb) {
    this.contactCallbacks.push(cb)
  }

  processContactCallbacks() {
    for (const cb of this.contactCallbacks) {
      cb.exec()
    }
    this.contactCallbacks.length = 0
  }

  queueTriggerCallback(cb) {
    this.triggerCallbacks.push(cb)
  }

  processTriggerCallbacks() {
    for (const cb of this.triggerCallbacks) {
      cb.exec()
    }
    this.triggerCallbacks.length = 0
  }
}
