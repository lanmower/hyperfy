import { Node } from './Node.js'
import { createPropertyProxy } from '../utils/helpers/defineProperty.js'

export class Group extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'group'
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, {}, super.getProxy())
    }
    return this.proxy
  }
}
