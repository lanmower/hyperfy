import { useEffect, useCallback, useRef } from 'react'

export function useWorldEvent(emitter, event, handler, deps = []) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!emitter) return
    const callback = (...args) => handlerRef.current(...args)
    emitter.on(event, callback)
    return () => emitter.off(event, callback)
  }, [emitter, event, ...deps])
}

export function useWorldEvents(emitter, eventMap, deps = []) {
  const handlersRef = useRef(eventMap)
  handlersRef.current = eventMap

  useEffect(() => {
    if (!emitter) return
    const callbacks = {}
    for (const [event, handler] of Object.entries(handlersRef.current)) {
      callbacks[event] = (...args) => handlersRef.current[event](...args)
      emitter.on(event, callbacks[event])
    }
    return () => {
      for (const [event, callback] of Object.entries(callbacks)) {
        emitter.off(event, callback)
      }
    }
  }, [emitter, ...deps])
}

export function useEntityEvent(world, entityId, event, handler, deps = []) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!world || !entityId) return
    const entity = world.entities.get(entityId)
    if (!entity) return
    const callback = (...args) => handlerRef.current(...args)
    entity.on(event, callback)
    return () => entity.off(event, callback)
  }, [world, entityId, event, ...deps])
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
