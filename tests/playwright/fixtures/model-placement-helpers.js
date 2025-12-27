export const modelPlacementFixtures = {
  setupDebugEnvironment: async (page) => {
    await page.evaluate(() => {
      if (!window.__DEBUG__) {
        window.__DEBUG__ = {}
      }

      window.__DEBUG__.networkMessages = []
      window.__DEBUG__.consoleErrors = []
      window.__DEBUG__.consoleWarnings = []

      const origLog = console.log
      const origWarn = console.warn
      const origError = console.error

      console.log = function(...args) {
        origLog(...args)
      }

      console.warn = function(...args) {
        window.__DEBUG__.consoleWarnings.push(args)
        origWarn(...args)
      }

      console.error = function(...args) {
        window.__DEBUG__.consoleErrors.push(args)
        origError(...args)
      }

      if (window.__DEBUG__.network?.send) {
        const origSend = window.__DEBUG__.network.send
        window.__DEBUG__.network.send = function(type, data) {
          window.__DEBUG__.networkMessages.push({ type, data, time: Date.now() })
          return origSend.call(this, type, data)
        }
      }
    })
  },

  getErrorLog: async (page) => {
    return page.evaluate(() => window.__DEBUG__?.consoleErrors || [])
  },

  getNetworkMessages: async (page) => {
    return page.evaluate(() => window.__DEBUG__?.networkMessages || [])
  },

  selectModel: async (page, appId) => {
    return page.evaluate((id) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      if (app) {
        window.__DEBUG__?.systems?.selectionManager?.()?.select(app)
        return true
      }
      return false
    }, appId)
  },

  deselectModel: async (page) => {
    return page.evaluate(() => {
      window.__DEBUG__?.systems?.selectionManager?.()?.select(null)
      return true
    })
  },

  getSelectedModel: async (page) => {
    return page.evaluate(() => {
      const selected = window.__DEBUG__?.systems?.selectionManager?.()?.selected
      if (!selected) return null
      return {
        id: selected.data.id,
        position: selected.root.position.toArray(),
        quaternion: selected.root.quaternion.toArray(),
        scale: selected.root.scale.toArray(),
        mover: selected.data.mover,
      }
    })
  },

  getAllModels: async (page) => {
    return page.evaluate(() => {
      const apps = window.__DEBUG__?.apps?.() || []
      return apps.map(app => ({
        id: app.data.id,
        position: app.root.position.toArray(),
        quaternion: app.root.quaternion.toArray(),
        scale: app.root.scale.toArray(),
        mover: app.data.mover,
        pinned: app.data.pinned,
        blueprint: app.data.blueprint,
      }))
    })
  },

  getSceneState: async (page) => {
    return page.evaluate(() => {
      const stage = window.__DEBUG__?.systems?.stage?.()
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()

      return {
        childrenCount: stage?.scene?.children?.length || 0,
        hasGizmo: gizmo?.gizmo !== null,
        gizmoActive: gizmo?.gizmoActive || false,
        fog: {
          enabled: !!stage?.scene?.fog,
          near: stage?.scene?.fog?.near || 0,
          far: stage?.scene?.fog?.far || 0,
        },
        background: !!stage?.scene?.background,
        environment: !!stage?.scene?.environment,
      }
    })
  },

  setMode: async (page, mode) => {
    return page.evaluate((m) => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      builder?.setMode(m)
      return true
    }, mode)
  },

  getMode: async (page) => {
    return page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      return builder?.getMode?.() || null
    })
  },

  enableBuildMode: async (page) => {
    return page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      builder?.toggle(true)
      return builder?.enabled || false
    })
  },

  isBuildModeEnabled: async (page) => {
    return page.evaluate(() => {
      const builder = window.__DEBUG__?.systems?.clientBuilder?.()
      return builder?.enabled || false
    })
  },

  moveModel: async (page, appId, position) => {
    return page.evaluate(({ id, pos }) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      if (app) {
        app.root.position.set(...pos)
        app.root.updateMatrix()
        return true
      }
      return false
    }, { id: appId, pos: position })
  },

  rotateModel: async (page, appId, quaternion) => {
    return page.evaluate(({ id, quat }) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      if (app) {
        app.root.quaternion.set(...quat)
        app.root.updateMatrix()
        return true
      }
      return false
    }, { id: appId, quat: quaternion })
  },

  scaleModel: async (page, appId, scale) => {
    return page.evaluate(({ id, s }) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      if (app) {
        app.root.scale.set(...s)
        app.root.updateMatrix()
        return true
      }
      return false
    }, { id: appId, s: scale })
  },

  verifyMoverIsSet: async (page, appId, expectedMover) => {
    return page.evaluate(({ id, mover }) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      return app?.data?.mover === mover
    }, { id: appId, mover: expectedMover })
  },

  verifyMoverIsNull: async (page, appId) => {
    return page.evaluate((id) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      return app?.data?.mover === null
    }, appId)
  },

  verifyModelInScene: async (page, appId) => {
    return page.evaluate((id) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      const stage = window.__DEBUG__?.systems?.stage?.()

      if (!app || !stage?.scene) return false

      const isInScene = (() => {
        const check = (obj) => {
          if (obj === app.root) return true
          if (obj.children) {
            for (const child of obj.children) {
              if (check(child)) return true
            }
          }
          return false
        }
        return check(stage.scene)
      })()

      return isInScene
    }, appId)
  },

  verifyGizmoAttached: async (page) => {
    return page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      return gizmo?.gizmo !== null && gizmo?.gizmoTarget !== null
    })
  },

  verifyGizmoDetached: async (page) => {
    return page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      return gizmo?.gizmo === null && gizmo?.gizmoTarget === null
    })
  },

  getGizmoPosition: async (page) => {
    return page.evaluate(() => {
      const gizmo = window.__DEBUG__?.systems?.gizmoManager?.()
      if (!gizmo?.gizmoTarget) return null
      return gizmo.gizmoTarget.position.toArray()
    })
  },

  getOutlineColor: async (page, appId) => {
    return page.evaluate((id) => {
      const apps = window.__DEBUG__?.apps?.() || []
      const app = apps.find(a => a.data.id === id)
      return app?.outline || null
    }, appId)
  },

  waitForNetworkMessage: async (page, messageType, timeout = 5000) => {
    return page.waitForFunction(
      (type) => {
        const messages = window.__DEBUG__?.networkMessages || []
        return messages.some(m => m.type === type)
      },
      messageType,
      { timeout }
    )
  },

  captureScreenshotOnFailure: async (page, testName) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `test-results/${testName}-${timestamp}.png`
    await page.screenshot({ path: filename })
    return filename
  },

  getConsoleErrors: async (page) => {
    return page.evaluate(() => window.__DEBUG__?.consoleErrors || [])
  },

  getConsoleWarnings: async (page) => {
    return page.evaluate(() => window.__DEBUG__?.consoleWarnings || [])
  },

  clearNetworkMessageLog: async (page) => {
    return page.evaluate(() => {
      window.__DEBUG__.networkMessages = []
      return true
    })
  },

  clearConsoleLog: async (page) => {
    return page.evaluate(() => {
      window.__DEBUG__.consoleErrors = []
      window.__DEBUG__.consoleWarnings = []
      return true
    })
  },

  verifyNetworkSyncFrequency: async (page, minMessages = 1) => {
    return page.evaluate((min) => {
      const messages = window.__DEBUG__?.networkMessages || []
      const modifyMessages = messages.filter(m => m.type === 'entityModified')
      return modifyMessages.length >= min
    }, minMessages)
  },

  getWorldMetrics: async (page) => {
    return page.evaluate(() => {
      const world = window.__DEBUG__?.world
      const apps = window.__DEBUG__?.apps?.() || []
      const entities = window.__DEBUG__?.entities?.() || []

      return {
        appCount: apps.length,
        entityCount: entities.length,
        playerCount: (window.__DEBUG__?.players?.() || []).length,
        blueprintCount: (window.__DEBUG__?.blueprints?.() || []).length,
        hasLoader: !!world?.loader,
        hasNetwork: !!world?.network,
        networkId: world?.network?.id || 'unknown',
      }
    })
  },
}

export default modelPlacementFixtures
