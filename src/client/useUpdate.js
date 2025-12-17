import { useEffect } from 'react'

export function useUpdate(callback, deps) {
  useEffect(() => {
    callback()
  }, deps)
}
