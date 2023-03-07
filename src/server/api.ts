// request handler for stocks
import { inferAsyncReturnType } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { z } from 'zod'
import lodash from 'lodash'
import { router, publicProcedure } from './trpc.js'
import admin from 'firebase-admin'
import { stockCandles } from './api/stock-candles.js'

interface User {
  id: string
  name: string
}
const userList: User[] = [
  {
    id: '1',
    name: 'MATEH',
  },
]

export const appRouter = router({
  test: publicProcedure.query(async () => {
    const data = await admin.firestore().collection('test').get()
    // key by id
    const result = data.docs.reduce((acc, doc) => {
      const id = doc.id
      const data = doc.data()
      return lodash.set(acc, id, data)
    }, {})
    return result
  }),
  userById: publicProcedure
    .input((val: unknown) => {
      if (typeof val === 'string') return val
      throw new Error(`Invalid input: ${typeof val}`)
    })
    .query((req) => {
      const input = req.input
      const user = userList.find((it) => it.id === input)
      return user
    }),
  userCreate: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation((req) => {
      const id = `${Math.random()}`
      const user: User = {
        id,
        name: req.input.name,
      }
      userList.push(user)
      return user
    }),

  // procedure to fetch the stock candles between two dates
  stockCandles,
})
export type AppRouter = typeof appRouter

export type ContextOptions = trpcExpress.CreateExpressContextOptions
// created for each request
const createContext = () => ({}) // no context
export type Context = inferAsyncReturnType<typeof createContext>

export function createMiddleware() {
  return trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
}
