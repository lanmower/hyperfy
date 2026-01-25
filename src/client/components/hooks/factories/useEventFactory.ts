import { useEffect, useCallback, useRef } from 'react'

export function useEventFactory(emitter, event, handler, deps = []) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!emitter) return
    const callback = (...args) => handlerRef.current(...args)
    emitter.on(event, callback)
    return () => emitter.off(event, callback)
  }, [emitter, event, ...deps])
}

export function useEventFactoryMulti(emitter, eventMap, deps = []) {
  const handlersRef = useRef(eventMap)
  handlersRef.current = eventMap

  useEffect(() => {
    if (!emitter) return
    const callbacks = {}
    for (const [eventName, handler] of Object.entries(handlersRef.current)) {
      callbacks[eventName] = (...args) => handlersRef.current[eventName](...args)
      emitter.on(eventName, callbacks[eventName])
    }
    return () => {
      for (const [eventName, callback] of Object.entries(callbacks)) {
        emitter.off(eventName, callback)
      }
    }
  }, [emitter, ...deps])
}
