import { useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { useMenuHint } from '../hooks/index.js'

export function MenuItemRange({ label, hint, min = 0, max = 1, step = 0.05, instant, value, onChange }) {
  const hintProps = useMenuHint(hint)
  const trackRef = useRef()
  if (value === undefined || value === null) value = 0
  const [local, setLocal] = useState(value)
  const [sliding, setSliding] = useState(false)
  useEffect(() => {
    if (!sliding && local !== value) setLocal(value)
  }, [sliding, value])
  useEffect(() => {
    const track = trackRef.current
    const calculateValueFromPointer = (e, el) => {
      const rect = el.getBoundingClientRect()
      const position = (e.clientX - rect.left) / rect.width
      const rawValue = min + position * (max - min)
      const steppedValue = Math.round(rawValue / step) * step
      return Math.max(min, Math.min(max, steppedValue))
    }
    let sliding
    const onPointerDown = e => {
      sliding = true
      setSliding(true)
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onPointerMove = e => {
      if (!sliding) return
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
    }
    const onPointerUp = e => {
      if (!sliding) return
      sliding = false
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
  }, [])
  const barWidthPercentage = ((local - min) / (max - min)) * 100 + ''
  const text = useMemo(() => {
    const decimalDigits = (local.toString().split('.')[1] || '').length
    return decimalDigits <= 2 ? local.toString() : local.toFixed(2)
  }, [local])
  return (
    <div
      className='menuitemrange'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 0.875rem;
        .menuitemrange-label { flex: 1; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; padding-right: 1rem; }
        .menuitemrange-text { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-right: 0.5rem; opacity: 0; }
        .menuitemrange-track {
          width: 7rem; flex-shrink: 0; height: 0.5rem; border-radius: 0.1rem;
          display: flex; align-items: stretch; background-color: rgba(255, 255, 255, 0.1);
          &:hover { cursor: pointer; }
        }
        .menuitemrange-bar { background-color: white; border-radius: 0.1rem; width: ${barWidthPercentage}%; }
        &:hover { background-color: rgba(255, 255, 255, 0.05); .menuitemrange-text { opacity: 1; } }
      `}
      {...hintProps}
    >
      <div className='menuitemrange-label'>{label}</div>
      <div className='menuitemrange-text'>{text}</div>
      <div className='menuitemrange-track' ref={trackRef}>
        <div className='menuitemrange-bar' />
      </div>
    </div>
  )
}
