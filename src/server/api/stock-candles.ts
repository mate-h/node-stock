import { z } from 'zod'
import { publicProcedure } from '../trpc.js'
import admin from 'firebase-admin'
import lodash from 'lodash'
import { createProcedure } from '../proc.js'

export const stockCandles = publicProcedure
  .input(
    z.object({
      symbol: z.string(),
      from: z.string(),
      to: z.string(),
    })
  )
  .query(async (req) => {
    const { symbol, from, to } = req.input
    const data = await admin
      .firestore()
      .collection('stocks')
      .doc(symbol)
      .collection('candles')
      .where('timestamp', '>=', from)
      .where('timestamp', '<=', to)
      .get()
    // key by id
    const result = data.docs.reduce((acc, doc) => {
      const id = doc.id
      const data = doc.data()
      return lodash.set(acc, id, data)
    }, {})
    return result
  })

export default createProcedure(stockCandles)
