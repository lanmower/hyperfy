import { useEffect, useState, useCallback, useRef } from 'react'

export function useFieldBase(initialValue, onChange, options = {}) {
  const { coerce, validate, selectOnFocus = false, multiline = false, instant = false, autoHeight = false } = options
  const textareaRef = useRef()
  const [localValue, setLocalValue] = useState(coerce ? coerce(initialValue ?? '') : (initialValue ?? ''))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      const coercedValue = coerce ? coerce(initialValue ?? '') : (initialValue ?? '')
      if (localValue !== coercedValue) setLocalValue(coercedValue)
    }
  }, [initialValue, isFocused, coerce])

  useEffect(() => {
    if (!autoHeight || !textareaRef.current) return
    const textarea = textareaRef.current
    function update() {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
    update()
    textarea.addEventListener('input', update)
    return () => textarea.removeEventListener('input', update)
  }, [autoHeight])

  const handleCommit = useCallback(valueToCommit => {
    if (validate && !validate(valueToCommit)) return
    onChange(valueToCommit)
  }, [onChange, validate])

  const handleChange = useCallback(e => {
    const newValue = e.target.value
    setLocalValue(newValue)
    if (instant) handleCommit(newValue)
  }, [instant, handleCommit])

  const handleFocus = useCallback(e => {
    setIsFocused(true)
    if (selectOnFocus) e.target.select()
  }, [selectOnFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    handleCommit(localValue)
  }, [localValue, handleCommit])

  const handleKeyDown = useCallback(e => {
    if (e.code === 'Enter' && !multiline) {
      e.preventDefault()
      handleCommit(localValue)
      e.target.blur()
    }
  }, [multiline, localValue, handleCommit])

  return {
    ref: textareaRef,
    value: localValue,
    isFocused,
    handlers: {
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
  }
}
