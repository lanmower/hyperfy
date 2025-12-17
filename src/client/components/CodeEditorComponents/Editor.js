import { useEffect, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { hashFile } from '../../../core/utils-client.js'
import { load } from './monacoTheme.js'

export function Editor({ app }) {
  const mountRef = useRef()
  const codeRef = useRef()
  const [editor, setEditor] = useState(null)
  const save = async () => {
    const world = app.world
    const blueprint = app.blueprint
    const code = codeRef.current
    const blob = new Blob([code], { type: 'text/plain' })
    const file = new File([blob], 'script.js', { type: 'text/plain' })
    const hash = await hashFile(file)
    const filename = `${hash}.js`
    const url = `asset://${filename}`
    world.loader.insert('script', url, file)
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, script: url })
    await world.network.upload(file)
    world.network.send('blueprintModified', { id: blueprint.id, version, script: url })
  }
  useEffect(() => {
    let dead
    load().then(monaco => {
      if (dead) return
      codeRef.current = app.script?.code || '// ...'
      const mount = mountRef.current
      const editor = monaco.editor.create(mount, {
        value: codeRef.current,
        language: 'javascript',
        scrollBeyondLastLine: true,
        lineNumbers: 'on',
        minimap: {
          enabled: false,
        },
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
      })
      editor.onDidChangeModelContent(event => {
        codeRef.current = editor.getValue()
      })
      editor.addAction({
        id: 'save',
        label: 'Save',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: save,
      })
      setEditor(editor)
    })
    return () => {
      dead = true
    }
  }, [])

  return (
    <div
      className='editor'
      css={css`
        flex: 1;
        position: relative;
        overflow: hidden;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        .editor-mount {
          position: absolute;
          inset: 0;
        }
      `}
    >
      <div className='editor-mount' ref={mountRef} />
    </div>
  )
}
