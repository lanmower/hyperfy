import { useEffect, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { Rows3Icon, XIcon } from 'lucide-react'
import { storage } from '../../core/storage.js'
import { cls } from './cls.js'
import { Editor } from './CodeEditorComponents/Editor.js'
import { Nodes } from './CodeEditorComponents/Nodes.js'

export function CodeEditor({ app, blur, onClose }) {
  const containerRef = useRef()
  const resizeRef = useRef()
  const [nodes, setNodes] = useState(false)
  useEffect(() => {
    const elem = resizeRef.current
    const container = containerRef.current
    container.style.width = `${storage.get('code-editor-width', 640)}px`
    let active
    function onPointerDown(e) {
      active = true
      elem.addEventListener('pointermove', onPointerMove)
      elem.addEventListener('pointerup', onPointerUp)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    function onPointerMove(e) {
      const newWidth = container.offsetWidth - e.movementX
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
    <div
      ref={containerRef}
      className='acode'
      css={css`
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 640px;
        background-color: rgba(15, 16, 24, 0.8);
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        opacity: ${blur ? 0.3 : 1};
        transform: ${blur ? 'translateX(90%)' : 'translateX(0%)'};
        transition:
          opacity 0.15s ease-out,
          transform 0.15s ease-out;
        .acode-head {
          height: 50px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          padding: 0 10px 0 20px;
          &-title {
            font-weight: 500;
            font-size: 20px;
            flex: 1;
          }
          &-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7d7d7d;
            &:hover {
              cursor: pointer;
              color: white;
            }
            &.selected {
              color: white;
            }
          }
          &-close {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7d7d7d;
            &:hover {
              cursor: pointer;
              color: white;
            }
          }
        }
        .acode-resizer {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -5px;
          width: 10px;
          cursor: ew-resize;
        }
        .monaco-editor {
          // removes the blue focus border
          --vscode-focusBorder: #00000000 !important;
        }
      `}
    >
      <div className='acode-head'>
        <div className='acode-head-title'>Code</div>
        <div className={cls('acode-head-btn', { selected: nodes })} onClick={() => setNodes(!nodes)}>
          <Rows3Icon size={20} />
        </div>
        <div className='acode-head-close' onClick={() => world.ui.toggleCode()}>
          <XIcon size={24} />
        </div>
      </div>
      {!nodes && <Editor app={app} />}
      {nodes && <Nodes app={app} />}
      <div className='acode-resizer' ref={resizeRef} />
    </div>
  )
}
