import { useFieldBase } from './useFieldBase.js'

export function useFieldText(value, onChange) {
  const { value: localValue, handlers } = useFieldBase(value, onChange, { selectOnFocus: true })
  return {
    value: localValue || '',
    onChange: handlers.onChange,
    onFocus: handlers.onFocus,
    onBlur: handlers.onBlur,
    onKeyDown: handlers.onKeyDown,
  }
}
