import { css } from '@firebolt-dev/css'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { HintContext } from '../../Hint.js'

export function FieldRange({ label, hint, min = 0, max = 1, step = 0.05, instant, value, onChange }) {
  const { setHint } = useContext(HintContext)
  const trackRef = useRef()
  if (value === undefined || value === null) {
    value = 0
  }
  const [local, setLocal] = useState(value)
  const [sliding, setSliding] = useState(false)
  useEffect(() => {
    if (!sliding && local !== value) setLocal(value)
  }, [sliding, value])
  useEffect(() => {
    const track = trackRef.current
    function calculateValueFromPointer(e, trackElement) {
      const rect = trackElement.getBoundingClientRect()
      const position = (e.clientX - rect.left) / rect.width
      const rawValue = min + position * (max - min)
      const steppedValue = Math.round(rawValue / step) * step
      return Math.max(min, Math.min(max, steppedValue))
    }
    let sliding
    function onPointerDown(e) {
      sliding = true
      setSliding(true)
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    function onPointerMove(e) {
      if (!sliding) return
      const newValue = calculateValueFromPointer(e, e.currentTarget)
      setLocal(newValue)
      if (instant) onChange(newValue)
    }
    function onPointerUp(e) {
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
    const num = local
    const decimalDigits = (num.toString().split('.')[1] || '').length
    if (decimalDigits <= 2) {
      return num.toString()
    }
    return num.toFixed(2)
  }, [local])
  return (
    <div
      className='fieldrange'
      css={css`
        display: flex;
        align-items: center;
        height: 2.5rem;
        padding: 0 1rem;
        .fieldrange-label {
          flex: 1;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
          padding-right: 1rem;
        }
        .fieldrange-text {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          margin-right: 0.5rem;
          opacity: 0;
        }
        .fieldrange-track {
          width: 7rem;
          flex-shrink: 0;
          height: 0.5rem;
          border-radius: 0.1rem;
          display: flex;
          align-items: stretch;
          background-color: rgba(255, 255, 255, 0.1);
          &:hover {
            cursor: pointer;
          }
        }
        .fieldrange-bar {
          background-color: white;
          border-radius: 0.1rem;
          width: ${barWidthPercentage}%;
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.03);
          .fieldrange-text {
            opacity: 1;
          }
        }
      `}
      onPointerEnter={() => setHint(hint)}
      onPointerLeave={() => setHint(null)}
    >
      <div className='fieldrange-label'>{label}</div>
      <div className='fieldrange-text'>{text}</div>
      <div className='fieldrange-track' ref={trackRef}>
        <div className='fieldrange-bar' />
      </div>
    </div>
  )
}
