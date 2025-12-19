import { useEffect, useState } from 'react'

export function useFieldText(value, onChange) {
  const [localValue, setLocalValue] = useState(value ?? '')

  useEffect(() => {
    if (localValue !== value) setLocalValue(value ?? '')
  }, [value])

  const handleChange = e => setLocalValue(e.target.value)
  const handleFocus = e => e.target.select()
  const handleBlur = () => onChange(localValue)
  const handleKeyDown = e => {
    if (e.code === 'Enter') {
      e.preventDefault()
      onChange(localValue)
      e.target.blur()
    }
  }

  return {
    value: localValue || '',
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  }
}
