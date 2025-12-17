const Modes = {
  ACTIVE: 'active',
  MOVING: 'moving',
  LOADING: 'loading',
  CRASHED: 'crashed',
}

export class ScriptExecutor {
  constructor(app) {
    this.app = app
  }

  executeScript(script, blueprint, props, setTimeout, getWorldProxy, getAppProxy, fetch) {
    const app = this.app
    app.abortController = new AbortController()
    app.script = script
    app.keepActive = false
    try {
      app.script.exec(getWorldProxy(), getAppProxy(), fetch, props, setTimeout)
    } catch (err) {
      console.error('script crashed')
      console.error(err)
      if (app.world.errorMonitor) {
        app.world.errorMonitor.captureError('app.script.execution', [err.message], err.stack || '')
      }
      return false
    }
    return true
  }

  fixedUpdate(delta) {
    const app = this.app
    if (app.mode === Modes.ACTIVE && app.script) {
      try {
        app.emit('fixedUpdate', delta)
      } catch (err) {
        console.error('script fixedUpdate crashed', app)
        console.error(err)
        if (app.world.errorMonitor) {
          app.world.errorMonitor.captureError('app.script.fixedUpdate', [err.message], err.stack || '')
        }
        app.crash()
      }
    }
  }

  update(delta) {
    const app = this.app
    if (app.mode === Modes.ACTIVE && app.script) {
      try {
        app.emit('update', delta)
      } catch (err) {
        console.error('script update() crashed', app)
        console.error(err)
        if (app.world.errorMonitor) {
          app.world.errorMonitor.captureError('app.script.update', [err.message], err.stack || '')
        }
        app.crash()
      }
    }
  }

  lateUpdate(delta) {
    const app = this.app
    if (app.mode === Modes.ACTIVE && app.script) {
      try {
        app.emit('lateUpdate', delta)
      } catch (err) {
        console.error('script lateUpdate() crashed', app)
        console.error(err)
        if (app.world.errorMonitor) {
          app.world.errorMonitor.captureError('app.script.lateUpdate', [err.message], err.stack || '')
        }
        app.crash()
      }
    }
  }

  cleanup() {
    const app = this.app
    app.abortController?.abort()
    app.abortController = null
    app.script = null
  }
}
