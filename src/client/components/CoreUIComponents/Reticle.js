import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'
import { isTouch } from '../utils.js'

export function Reticle({ world }) {
  const [pointerLocked, setPointerLocked] = useState(world.controls.pointer.locked)
  const [buildMode, setBuildMode] = useState(world.builder.enabled)
  useEffect(() => {
    world.on('pointer-lock', setPointerLocked)
    world.on('build-mode', setBuildMode)
    return () => {
      world.off('pointer-lock', setPointerLocked)
      world.off('build-mode', setBuildMode)
    }
  }, [])
  const visible = isTouch ? true : pointerLocked
  if (!visible) return null
  return (
    <div
      className='reticle'
      css={css`
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        .reticle-item {
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 0.625rem;
          background: ${buildMode ? '#ff4d4d' : 'white'};
          border: 0.5px solid rgba(0, 0, 0, 0.3);
        }
      `}
    >
      <div className='reticle-item' />
    </div>
  )
}
