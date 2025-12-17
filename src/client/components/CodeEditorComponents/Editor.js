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
    // convert to file
    const blob = new Blob([code], { type: 'text/plain' })
    const file = new File([blob], 'script.js', { type: 'text/plain' })
    // immutable hash the file
    const hash = await hashFile(file)
    // use hash as glb filename
    const filename = `${hash}.js`
    // canonical url to this file
    const url = `asset://${filename}`
    // cache file locally so this client can insta-load it
    world.loader.insert('script', url, file)
    // update blueprint locally (also rebuilds apps)
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, script: url })
    // upload script
    await world.network.upload(file)
    // broadcast blueprint change to server + other clients
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
