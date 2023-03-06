import { createServer } from '.'
import * as dotenv from 'dotenv'

dotenv.config()

const isTest = process.env.VITEST

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(5173, () => {
      console.log('http://localhost:5173')
    })
  )
}
