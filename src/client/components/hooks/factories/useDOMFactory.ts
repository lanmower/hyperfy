import { useRef, useEffect, useCallback, useState } from 'react'

export function useDOMFactory(selector, manipulation) {
  const [element, setElement] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (selector) {
      const el = document.querySelector(selector)
      setElement(el)
      if (el && manipulation) manipulation(el)
    } else {
      setElement(ref.current)
      if (manipulation) manipulation(ref.current)
    }

    return () => {
      if (manipulation.cleanup) manipulation.cleanup()
    }
  }, [selector, manipulation])

  const query = useCallback((sel) => {
    return ref.current?.querySelector(sel)
  }, [])

  const queryAll = useCallback((sel) => {
    return ref.current?.querySelectorAll(sel) || []
  }, [])

  return { element, ref, query, queryAll }
}
