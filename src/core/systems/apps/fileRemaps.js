import { FILE_TYPES } from './FieldTypeConstants.js'

export const fileRemaps = Object.fromEntries(FILE_TYPES.map(type => [
  type,
  field => { field.type = 'file'; field.kind = type }
]))
