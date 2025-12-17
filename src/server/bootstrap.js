import sourceMapSupport from 'source-map-support'
import path from 'path'
import { fileURLToPath } from 'url'

import 'dotenv-flow/config'

sourceMapSupport.install()

globalThis.__dirname = path.dirname(fileURLToPath(import.meta.url))
