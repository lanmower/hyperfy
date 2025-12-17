import { useEffect, useState } from 'react'
import { MenuItemFileBtn, MenuItemBtn, MenuLine } from '../Menu.js'
import { exportApp } from '../../../core/extras/appTools.js'
import { downloadFile } from '../../../core/extras/downloadFile.js'
import { hashFile } from '../../../core/utils-client.js'
import { MenuItemField } from './MenuItemField.js'

const extToType = {
  glb: 'model',
  vrm: 'avatar',
}
const allowedModels = ['glb', 'vrm']

function MenuItemFields({ world, app, blueprint }) {
  const [fields, setFields] = useState(() => app.fields)
  const props = blueprint.props

  useEffect(() => {
    app.onFields = setFields
    return () => {
      app.onFields = null
    }
  }, [])

  const modify = (key, value) => {
    if (props[key] === value) return
    const bp = world.blueprints.get(blueprint.id)
    const newProps = { ...bp.props, [key]: value }
    const id = bp.id
    const version = bp.version + 1
    world.blueprints.modify({ id, version, props: newProps })
    world.network.send('blueprintModified', { id, version, props: newProps })
  }

  return fields.map(field => (
    <MenuItemField key={field.key} world={world} props={props} field={field} value={props[field.key]} modify={modify} />
  ))
}

export function MenuAppIndex({ world, app, blueprint, pop, push }) {
  const frozen = blueprint.frozen

  const changeModel = async file => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowedModels.includes(ext)) return
    const hash = await hashFile(file)
    const filename = `${hash}.${ext}`
    const url = `asset://${filename}`
    const type = extToType[ext]
    world.loader.insert(type, url, file)
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, model: url })
    await world.network.upload(file)
    world.network.send('blueprintModified', { id: blueprint.id, version, model: url })
  }

  const download = async () => {
    try {
      const file = await exportApp(app.blueprint, world.loader.loadFile)
      downloadFile(file)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <MenuItemFields world={world} app={app} blueprint={blueprint} />
      {app.fields?.length > 0 && <MenuLine />}
      {!frozen && (
        <MenuItemFileBtn
          label='Model'
          hint='Change the model for this app'
          accept='.glb,.vrm'
          value={blueprint.model}
          onChange={changeModel}
        />
      )}
      {!frozen && <MenuItemBtn label='Code' hint='View or edit the code for this app' onClick={world.ui.toggleCode} />}
      {!frozen && <MenuItemBtn label='Flags' hint='View/edit flags for this app' onClick={() => push('flags')} nav />}
      <MenuItemBtn label='Metadata' hint='View/edit metadata for this app' onClick={() => push('metadata')} nav />
      <MenuItemBtn label='Download' hint='Download this app as a .hyp file' onClick={download} />
      <MenuItemBtn
        label='Delete'
        hint='Delete this app instance'
        onClick={() => {
          world.ui.setMenu(null)
          app.destroy(true)
        }}
      />
    </>
  )
}
