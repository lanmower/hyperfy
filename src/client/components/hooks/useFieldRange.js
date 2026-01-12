import { useEffect, useState, useRef, useMemo } from 'react'

export function useFieldRange(value, onChange, { min = 0, max = 1, step = 0.05, instant = false } = {}) {
  const trackRef = useRef()
  const safeValue = value ?? 0
  const [local, setLocal] = useState(safeValue)
  const [sliding, setSliding] = useState(false)

  useEffect(() => {
    if (!sliding && local !== safeValue) setLocal(safeValue)
  }, [sliding, safeValue])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const calculateValueFromPointer = (e, el) => {
      const rect = el.getBoundingClientRect()
      const position = (e.clientX - rect.left) / rect.width
      const rawValue = min + position * (max - min)
      const steppedValue = Math.round(rawValue / step) * step
      return Math.max(min, Math.min(max, steppedValue))
    }

    let isSliding = false
    const onPointerDown = e => {
      isSliding = true
      setSliding(true)
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onPointerMove = e => {
      if (!isSliding) return
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
    }
    const onPointerUp = e => {
      if (!isSliding) return
      isSliding = false
      setSliding(false)
      const finalValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(finalValue)
      onChange(finalValue)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    track.addEventListener('pointerdown', onPointerDown)
    track.addEventListener('pointermove', onPointerMove)
    track.addEventListener('pointerup', onPointerUp)
    return () => {
      track.removeEventListener('pointerdown', onPointerDown)
      track.removeEventListener('pointermove', onPointerMove)
      track.removeEventListener('pointerup', onPointerUp)
    }
  }, [min, max, step, instant, onChange])

  const barWidthPercentage = ((local - min) / (max - min)) * 100

  const text = useMemo(() => {
    const decimalDigits = (local.toString().split('.')[1] || '').length
    return decimalDigits <= 2 ? local.toString() : local.toFixed(2)
  }, [local])

  return { trackRef, barWidthPercentage, text }
}
