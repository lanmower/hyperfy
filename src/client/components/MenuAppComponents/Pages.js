import { useEffect, useState } from 'react'
import {
  MenuItemBack,
  MenuItemBtn,
  MenuItemCurve,
  MenuItemFile,
  MenuItemFileBtn,
  MenuItemNumber,
  MenuItemRange,
  MenuItemSwitch,
  MenuItemText,
  MenuItemTextarea,
  MenuItemToggle,
  MenuLine,
  MenuSection,
} from '../Menu.js'
import { exportApp } from '../../../core/extras/appTools.js'
import { downloadFile } from '../../../core/extras/downloadFile.js'
import { hashFile } from '../../../core/utils-client.js'
import { isArray, isBoolean } from 'lodash-es'

const extToType = {
  glb: 'model',
  vrm: 'avatar',
}
const allowedModels = ['glb', 'vrm']

export function MenuAppIndex({ world, app, blueprint, pop, push }) {
  const player = world.entities.player
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

function MenuItemField({ world, props, field, value, modify }) {
  if (field.hidden) {
    return null
  }
  if (field.when && isArray(field.when)) {
    for (const rule of field.when) {
      if (rule.op === 'eq' && props[rule.key] !== rule.value) {
        return null
      }
    }
  }
  if (field.type === 'section') {
    return <MenuSection label={field.label} />
  }
  if (field.type === 'text') {
    return (
      <MenuItemText
        label={field.label}
        hint={field.hint}
        placeholder={field.placeholder}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'textarea') {
    return (
      <MenuItemTextarea
        label={field.label}
        hint={field.hint}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'number') {
    return (
      <MenuItemNumber
        label={field.label}
        hint={field.hint}
        dp={field.dp}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'file') {
    return (
      <MenuItemFile
        label={field.label}
        hint={field.hint}
        kind={field.kind}
        value={value}
        onChange={value => modify(field.key, value)}
        world={world}
      />
    )
  }
  if (field.type === 'switch') {
    return (
      <MenuItemSwitch
        label={field.label}
        hint={field.hint}
        options={field.options}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'dropdown') {
    return (
      <MenuItemSwitch
        label={field.label}
        hint={field.hint}
        options={field.options}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'toggle') {
    return (
      <MenuItemToggle
        label={field.label}
        hint={field.hint}
        trueLabel={field.trueLabel}
        falseLabel={field.falseLabel}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'range') {
    return (
      <MenuItemRange
        label={field.label}
        hint={field.hint}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'curve') {
    return (
      <MenuItemCurve
        label={field.label}
        hint={field.hint}
        yMin={field.yMin}
        yMax={field.yMax}
        value={value}
        onChange={value => modify(field.key, value)}
      />
    )
  }
  if (field.type === 'button') {
    return <MenuItemBtn label={field.label} hint={field.hint} onClick={field.onClick} />
  }
  return null
}

export function MenuAppFlags({ world, app, blueprint, pop, push }) {
  const player = world.entities.player
  const toggle = async (key, value) => {
    value = isBoolean(value) ? value : !blueprint[key]
    if (blueprint[key] === value) return
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, [key]: value })
    world.network.send('blueprintModified', { id: blueprint.id, version, [key]: value })
  }
  return (
    <>
      <MenuItemBack hint='Go back to the main app details' onClick={pop} />
      <MenuItemToggle
        label='Preload'
        hint='Preload this app before players enter the world'
        value={blueprint.preload}
        onChange={value => toggle('preload', value)}
      />
      <MenuItemToggle
        label='Lock'
        hint='Lock the app so that after downloading it the model, script and metadata can no longer be edited'
        value={blueprint.locked}
        onChange={value => toggle('locked', value)}
      />
      <MenuItemToggle
        label='Unique'
        hint='When duplicating this app in the world, create a completely new and unique instance with its own separate config'
        value={blueprint.unique}
        onChange={value => toggle('unique', value)}
      />
    </>
  )
}

export function MenuAppMetadata({ world, app, blueprint, pop, push }) {
  const player = world.entities.player
  const set = async (key, value) => {
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, [key]: value })
    world.network.send('blueprintModified', { id: blueprint.id, version, [key]: value })
  }
  return (
    <>
      <MenuItemBack hint='Go back to the main app details' onClick={pop} />
      <MenuItemText
        label='Name'
        hint='The name of this app'
        value={blueprint.name}
        onChange={value => set('name', value)}
      />
      <MenuItemFile
        label='Image'
        hint='An image/icon for this app'
        kind='texture'
        value={blueprint.image}
        onChange={value => set('image', value)}
        world={world}
      />
      <MenuItemText
        label='Author'
        hint='The name of the author that made this app'
        value={blueprint.author}
        onChange={value => set('author', value)}
      />
      <MenuItemText label='URL' hint='A url for this app' value={blueprint.url} onChange={value => set('url', value)} />
      <MenuItemTextarea
        label='Description'
        hint='A description for this app'
        value={blueprint.desc}
        onChange={value => set('desc', value)}
      />
    </>
  )
}
