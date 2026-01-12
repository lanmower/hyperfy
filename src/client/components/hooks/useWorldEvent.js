import { useEventFactory, useEventFactoryMulti } from './factories/useEventFactory.js'

export function useWorldEvent(emitter, event, handler, deps = []) {
  useEventFactory(emitter, event, handler, deps)
}

export function useWorldEvents(emitter, eventMap, deps = []) {
  useEventFactoryMulti(emitter, eventMap, deps)
}

export function useEntityEvent(world, entityId, event, handler, deps = []) {
  useEventFactory(
    entityId && world ? world.entities.get(entityId) : null,
    event,
    handler,
    [world, entityId, ...deps]
  )
}

export function useWorldReady(world, handler) {
  useWorldEvent(world?.events, 'ready', handler, [world])
}

export function useControlsChange(world, handler) {
  useWorldEvent(world?.controls, 'change', handler, [world])
}

export function usePrefsChange(world, handler) {
  useWorldEvent(world?.prefs, 'change', handler, [world])
}
