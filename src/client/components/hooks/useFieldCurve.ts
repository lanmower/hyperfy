import React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Curve } from '../../../core/extras/Curve.js'

export function useFieldCurve(value, onChange) {
  const curve = useMemo(() => new Curve().deserialize(value || '0,0.5,0,0|1,0.5,0,0'), [value])
  const [edit, setEdit] = useState(false)

  const toggleEdit = useCallback(() => {
    setEdit(prev => prev ? null : curve.clone())
  }, [curve])

  const onCommit = useCallback(() => {
    onChange(edit.serialize())
    setEdit(null)
  }, [edit, onChange])

  const onCancel = useCallback(() => setEdit(null), [])

  return { curve, edit, toggleEdit, onCommit, onCancel }
}
