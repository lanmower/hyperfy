import { useEffect, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { hashFile } from '../../../core/utils-client.js'
import { load } from '../../utils/monacoLoader.js'

// editor will remember a single script so you can flip between tabs without hitting save (eg viewing docs)
const cached = {
  key: null,
  viewState: null,
  value: null,
  model: null,
}

export function Editor({ app, onHandle }) {
  const key = app.data.id
  const mountRef = useRef()
  const codeRef = useRef()
  const [editor, setEditor] = useState(null)
  const [fontSize, setFontSize] = useState(() => 12 * app.world.prefs.ui)
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
  const saveState = () => {
    if (editor) {
      cached.key = key
      cached.viewState = editor.saveViewState()
      cached.model = editor.getModel()
      cached.value = editor.getValue()
    }
  }
  useEffect(() => {
    onHandle({ save })
  }, [])
  useEffect(() => {
    const onPrefsChange = changes => {
      if (changes.ui) {
        setFontSize(14 * changes.ui.value)
      }
    }
    app.world.prefs.on('change', onPrefsChange)
    return () => {
      app.world.prefs.off('change', onPrefsChange)
    }
  }, [])
  useEffect(() => {
    if (editor) {
      editor.updateOptions({ fontSize })
    }
  }, [editor, fontSize])
  useEffect(() => {
    return () => {
      saveState()
      editor?.dispose()
    }
  }, [editor])
  useEffect(() => {
    let dead
    load().then(monaco => {
      if (dead) return
      // only use cached if it matches this key
      const state = cached.key === key ? cached : null
      const initialCode = state?.value ?? app.script?.code ?? '// …'
      const uri = monaco.Uri.parse(`inmemory://model/${key}`)
      let model = monaco.editor.getModel(uri)
      if (!model) {
        model = monaco.editor.createModel(initialCode, 'javascript', uri)
      } else if (model.getValue() !== initialCode) {
        model.setValue(initialCode)
      }
      codeRef.current = initialCode
      const editor = monaco.editor.create(mountRef.current, {
        model,
        language: 'javascript',
        scrollBeyondLastLine: true,
        lineNumbers: 'on',
        minimap: { enabled: false },
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        fontSize: fontSize,
      })
      if (state?.viewState) {
        editor.restoreViewState(state.viewState)
        editor.focus()
      }
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
        .monaco-editor {
          --vscode-focusBorder: #00000000 !important;
        }
      `}
    >
      <div className='editor-mount' ref={mountRef} />
    </div>
  )
}
