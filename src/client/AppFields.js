import { useState, useEffect } from 'react'
import {
  FieldText,
  FieldTextarea,
  FieldToggle,
  FieldFile,
} from './components/Fields.js'

export function AppFields({ world, app, blueprint }) {
  const [name, setName] = useState(blueprint.name || '')
  const [description, setDescription] = useState(blueprint.description || '')
  const [preview, setPreview] = useState(blueprint.preview || '')
  const [icon, setIcon] = useState(blueprint.icon || '')
  const [tags, setTags] = useState(blueprint.tags?.join(', ') || '')
  const [authors, setAuthors] = useState(blueprint.authors?.join(', ') || '')
  const [listable, setListable] = useState(blueprint.listable !== false)
  const [public_, setPublic] = useState(blueprint.public === true)
  const [locked, setLocked] = useState(blueprint.locked === true)
  const [preload, setPreload] = useState(blueprint.preload === true)
  const [unique, setUnique] = useState(blueprint.unique === true)

  const modify = (updates) => {
    const version = blueprint.version + 1
    world.blueprints.modify({ id: blueprint.id, version, ...updates })
    world.network.send('blueprintModified', { id: blueprint.id, version, ...updates })
  }

  useEffect(() => {
    const onModify = (bp) => {
      if (bp.id === blueprint.id) {
        setName(bp.name || '')
        setDescription(bp.description || '')
        setPreview(bp.preview || '')
        setIcon(bp.icon || '')
        setTags(bp.tags?.join(', ') || '')
        setAuthors(bp.authors?.join(', ') || '')
        setListable(bp.listable !== false)
        setPublic(bp.public === true)
        setLocked(bp.locked === true)
        setPreload(bp.preload === true)
        setUnique(bp.unique === true)
      }
    }
    world.blueprints.on('modify', onModify)
    return () => world.blueprints.off('modify', onModify)
  }, [blueprint.id])

  return (
    <>
      <FieldText
        label='Name'
        value={name}
        onChange={(value) => {
          setName(value)
          modify({ name: value })
        }}
      />
      <FieldTextarea
        label='Description'
        value={description}
        onChange={(value) => {
          setDescription(value)
          modify({ description: value })
        }}
      />
      <FieldText
        label='Icon URL'
        value={icon}
        onChange={(value) => {
          setIcon(value)
          modify({ icon: value })
        }}
      />
      <FieldText
        label='Preview Image URL'
        value={preview}
        onChange={(value) => {
          setPreview(value)
          modify({ preview: value })
        }}
      />
      <FieldText
        label='Tags (comma-separated)'
        value={tags}
        onChange={(value) => {
          setTags(value)
          const tagArray = value.split(',').map(t => t.trim()).filter(t => t)
          modify({ tags: tagArray })
        }}
      />
      <FieldText
        label='Authors (comma-separated)'
        value={authors}
        onChange={(value) => {
          setAuthors(value)
          const authorArray = value.split(',').map(a => a.trim()).filter(a => a)
          modify({ authors: authorArray })
        }}
      />
      <FieldToggle
        label='Listable'
        value={listable}
        onChange={(value) => {
          setListable(value)
          modify({ listable: value })
        }}
      />
      <FieldToggle
        label='Public'
        value={public_}
        onChange={(value) => {
          setPublic(value)
          modify({ public: value })
        }}
      />
      <FieldToggle
        label='Locked'
        value={locked}
        onChange={(value) => {
          setLocked(value)
          modify({ locked: value })
        }}
      />
      <FieldToggle
        label='Preload'
        value={preload}
        onChange={(value) => {
          setPreload(value)
          modify({ preload: value })
        }}
      />
      <FieldToggle
        label='Unique'
        value={unique}
        onChange={(value) => {
          setUnique(value)
          modify({ unique: value })
        }}
      />
    </>
  )
}
