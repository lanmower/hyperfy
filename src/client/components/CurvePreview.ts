import React from 'react'
import { useEffect, useRef } from 'react'
import { css } from '@firebolt-dev/css'

export function CurvePreview({ curve, yMin = 0, yMax = 1 }) {
  const elemRef = useRef()
  useEffect(() => {
    const elem = elemRef.current
    const width = elem.offsetWidth
    const height = elem.offsetHeight
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const steps = width
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const val = curve.evaluate(t)
      const x = (t * width)
      const y = height - (val - yMin) / (yMax - yMin) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    elem.appendChild(canvas)
    return () => {
      elem.removeChild(canvas)
    }
  }, [curve, yMin, yMax])
  return (
    <div
      ref={elemRef}
      className='CurvePreview'
      css={css`
        position: absolute;
        inset: 1px;
      `}
    />
  )
}
