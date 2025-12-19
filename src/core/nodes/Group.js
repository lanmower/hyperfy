import { Node } from './Node.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'

export class Group extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'group'
  }

  getProxy() {
    return createSchemaProxy(this, {})
  }
}
