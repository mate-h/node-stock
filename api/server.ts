import { createServer } from '../src/server/index.js'
import * as api from '../src/server/api.js'

const { app } = await createServer()

export { api }

export default app
