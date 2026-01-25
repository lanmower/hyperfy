import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { css } from '@firebolt-dev/css'
import { hashFile } from '../../../core/utils-client.js'
import { load } from '../../utils/monacoLoader.js'
import { NetworkUploadUtil } from '../../../core/utils/network/NetworkUploadUtil.js'
import { StructuredLogger } from '../../../core/utils/logging/index.js'

const logger = new StructuredLogger('Editor')

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
    const blob = new Blob([code], { type: 'text/plain' })
    const file = new File([blob], 'script.js', { type: 'text/plain' })
    const hash = await hashFile(file)
    const filename = `${hash}.js`
    const url = `asset://${filename}`
    world.loader.insert('script', url, file)
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, script: url })
    try {
      await NetworkUploadUtil.uploadWithRetry(world.network, file, { maxRetries: 3 })
    } catch (err) {
      logger.error('Script upload failed', { blueprintId: blueprint.id, error: err.message })
      return
    }
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
