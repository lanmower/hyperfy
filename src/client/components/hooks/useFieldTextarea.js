import { useFieldBase } from './useFieldBase.js'

export function useFieldTextarea(value, onChange) {
  const { value: localValue, ref, handlers } = useFieldBase(value, onChange, { selectOnFocus: true, multiline: true, autoHeight: true })

  return {
    ref,
    value: localValue || '',
    onChange: handlers.onChange,
    onFocus: handlers.onFocus,
    onBlur: handlers.onBlur,
    onKeyDown: handlers.onKeyDown,
  }
}
