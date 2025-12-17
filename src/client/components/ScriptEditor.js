import { Editor } from './ScriptEditorComponents/Editor.js'

export function ScriptEditor({ app, onHandle }) {
  return <Editor app={app} onHandle={onHandle} />
}
