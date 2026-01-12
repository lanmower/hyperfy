import { BaseFactory } from '../../patterns/BaseFactory.js'
import { APIMethodWrapper } from './APIMethodWrapper.js'

export class APIConfigBuilder extends BaseFactory {
  constructor(moduleName) {
    super(moduleName)
    this.moduleName = moduleName
    this.config = {
      getters: {},
      setters: {},
      methods: {},
    }
  }

  addGetter(name, fn, options = {}) {
    const { nullable = false, validateInput = false, transform = null } = options
    const wrappedFn = APIMethodWrapper.wrapGetter(fn, {
      module: this.moduleName,
      method: name,
      defaultReturn: nullable ? null : undefined,
    })
    this.config.getters[name] = wrappedFn
    return this
  }

  addSetter(name, fn, options = {}) {
    const { validate = false, coerce = false } = options
    const wrappedFn = APIMethodWrapper.wrapSetter(fn, {
      module: this.moduleName,
      method: name,
    })
    this.config.setters[name] = wrappedFn
    return this
  }

  addMethod(name, fn, options = {}) {
    const { validate = false, rateLimit = false, async: isAsync = false } = options
    const wrappedFn = APIMethodWrapper.wrapWithValidation(fn, {
      module: this.moduleName,
      method: name,
      operation: name,
    })
    this.config.methods[name] = wrappedFn
    return this
  }

  addGetterDirect(name, fn, options = {}) {
    const wrappedFn = APIMethodWrapper.wrapMethod(fn, {
      module: this.moduleName,
      method: name,
      defaultReturn: options.defaultReturn || null,
    })
    this.config.getters[name] = wrappedFn
    return this
  }

  addMethodDirect(name, fn, options = {}) {
    const wrappedFn = APIMethodWrapper.wrapMethod(fn, {
      module: this.moduleName,
      method: name,
      defaultReturn: options.defaultReturn || null,
    })
    this.config.methods[name] = wrappedFn
    return this
  }

  build() {
    return this.config
  }
}

export default APIConfigBuilder
