import React from 'react'
import { SaveIcon } from 'lucide-react'
import { cls } from '../cls.js'
import { useEffect, useRef, useState } from 'react'
import { ScriptEditor } from '../ScriptEditor.js'
import { storage } from '../../../core/storage.js'
import { Pane } from './Pane.js'
import { scriptStyles } from './SidebarStyles.js'

export function Script({ world, hidden }) {
  const app = world.ui.state.app
  const containerRef = useRef()
  const resizeRef = useRef()
  const [handle, setHandle] = useState(null)

  useEffect(() => {
    const elem = resizeRef.current
    const container = containerRef.current
    container.style.width = `${storage.get('code-editor-width', 500)}px`
    let active

    function onPointerDown(e) {
      active = true
      elem.addEventListener('pointermove', onPointerMove)
      elem.addEventListener('pointerup', onPointerUp)
      e.currentTarget.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e) {
      let newWidth = container.offsetWidth + e.movementX
      if (newWidth < 250) newWidth = 250
      container.style.width = `${newWidth}px`
      storage.set('code-editor-width', newWidth)
    }

    function onPointerUp(e) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      elem.removeEventListener('pointermove', onPointerMove)
      elem.removeEventListener('pointerup', onPointerUp)
    }

    elem.addEventListener('pointerdown', onPointerDown)
    return () => {
      elem.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return (
    <div ref={containerRef} className={cls('script', { hidden })} css={scriptStyles}>
      <div className='script-head'>
        <div className='script-title'>Script: {app.blueprint?.name}</div>
        <div className='script-btn' onClick={() => handle?.save()}>
          <SaveIcon size='1.125rem' />
        </div>
      </div>
      <ScriptEditor key={app.data.id} app={app} onHandle={setHandle} />
      <div className='script-resizer' ref={resizeRef} />
    </div>
  )
}
