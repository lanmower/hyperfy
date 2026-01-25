import { useState, useCallback, useRef, useEffect } from 'react'

export function useAsyncFactory(asyncFn, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const execute = useCallback(async (...args) => {
    const id = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn(...args)
      if (id === requestIdRef.current) {
        setData(result)
        setLoading(false)
      }
      return result
    } catch (err) {
      if (id === requestIdRef.current) {
        setError(err)
        setLoading(false)
      }
      throw err
    }
  }, [asyncFn])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  const retry = useCallback(async (...args) => {
    return execute(...args)
  }, [execute])

  return { data, loading, error, execute, retry, reset }
}
