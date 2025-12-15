import { Node } from './Node.js'

export class Group extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'group'
  }

  getProxy() {
    if (!this.proxy) {
      let proxy = {
        // ...
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
