export class ScriptExecutor {
  constructor(app) {
    this.app = app
    this.script = null
    this.context = null
    this.listeners = {
      fixedUpdate: null,
      update: null,
      lateUpdate: null,
    }
  }

  executeScript(scriptCode, blueprint, props, setTimeoutFn, getWorldProxy, getAppProxy, fetchFn) {
    if (!scriptCode) {
      return true
    }

    try {
      const world = this.app.world
      const scripts = world.scripts

      const evaluated = scripts.evaluate(scriptCode)
      const appContext = evaluated.exec(
        getWorldProxy(),
        getAppProxy(),
        fetchFn,
        props,
        setTimeoutFn
      )

      if (!appContext) {
        return true
      }

      this.context = appContext
      this.script = scriptCode

      if (appContext.fixedUpdate) {
        this.listeners.fixedUpdate = appContext.fixedUpdate
        this.app.on('fixedUpdate', this.listeners.fixedUpdate)
      }

      if (appContext.update) {
        this.listeners.update = appContext.update
        this.app.on('update', this.listeners.update)
      }

      if (appContext.lateUpdate) {
        this.listeners.lateUpdate = appContext.lateUpdate
        this.app.on('lateUpdate', this.listeners.lateUpdate)
      }

      appContext.onLoad?.()
      return true
    } catch (err) {
      console.error('[ScriptExecutor] Script execution failed:', err)
      return false
    }
  }

  fixedUpdate(delta) {
    if (this.listeners.fixedUpdate) {
      this.listeners.fixedUpdate(delta)
    }
  }

  update(delta) {
    if (this.listeners.update) {
      this.listeners.update(delta)
    }
  }

  lateUpdate(delta) {
    if (this.listeners.lateUpdate) {
      this.listeners.lateUpdate(delta)
    }
  }

  cleanup() {
    if (this.context?.onUnload) {
      try {
        this.context.onUnload()
      } catch (err) {
        console.error('[ScriptExecutor] onUnload failed:', err)
      }
    }

    if (this.listeners.fixedUpdate) {
      this.app.off('fixedUpdate', this.listeners.fixedUpdate)
    }
    if (this.listeners.update) {
      this.app.off('update', this.listeners.update)
    }
    if (this.listeners.lateUpdate) {
      this.app.off('lateUpdate', this.listeners.lateUpdate)
    }

    this.context = null
    this.script = null
    this.listeners = {
      fixedUpdate: null,
      update: null,
      lateUpdate: null,
    }
  }
}
