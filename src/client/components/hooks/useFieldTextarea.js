import { useEffect, useState, useRef } from 'react'

export function useFieldTextarea(value, onChange) {
  const textareaRef = useRef()
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    if (localValue !== value) setLocalValue(value)
  }, [value])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    function update() {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
    update()
    textarea.addEventListener('input', update)
    return () => textarea.removeEventListener('input', update)
  }, [])

  return {
    ref: textareaRef,
    value: localValue || '',
    onChange: e => setLocalValue(e.target.value),
    onFocus: e => e.target.select(),
    onKeyDown: e => {
      if (e.metaKey && e.code === 'Enter') {
        e.preventDefault()
        onChange(localValue)
        e.target.blur()
      }
    },
    onBlur: () => onChange(localValue),
  }
}
