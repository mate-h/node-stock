import { createServer } from '../src/server/index.js'
import * as api from '../src/server/api.js'
import * as config from '../src/server/api.js'

const { app } = await createServer()

console.log(process.env)

export { api, config }

export default app
