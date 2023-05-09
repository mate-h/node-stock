import { z } from 'zod'
import { publicProcedure } from '../trpc.js'
import { createProcedure } from '../proc.js'
import { getCandles } from '../finnhub/index.js'
import { CandleDatum, GetCandles, getUnit } from '@mateh/react-stock'
import lodash from 'lodash'

type CandleQuery = Parameters<GetCandles>[0]

const input: z.ZodType<CandleQuery> = z.object({
  symbol: z.string(),
  range: z.tuple([z.date(), z.date()]),
  resolution: z.enum(['1s', '1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M']),
  type: z.enum(['stock', 'crypto']),
})

const output: z.ZodType<CandleDatum[]> = z.array(
  z.object({
    date: z.date(),
    open: z.number(),
    close: z.number(),
    high: z.number(),
    low: z.number(),
    volume: z.number(),
  })
)

/**
 * Returns the range of the data in milliseconds
 * @param data the data to get the range of
 * @returns the range of the data in milliseconds
 */
function getDataRange(data: CandleDatum[]) {
  if (data.length === 0) return 0
  const dates = data.map((d) => d.date)
  const min = lodash.min(dates)!
  const max = lodash.max(dates)!
  const result = max.getTime() - min.getTime()
  console.log('[DEBUG] getDataRange', result)
  return result
}

/**
 * Queries the database for the data
 * @param input the input to the procedure
 * @returns the data from the database
 */
async function queryStocks({
  symbol,
  range,
  resolution,
}: z.infer<typeof input>) {
  console.log('[DEBUG] queryStocks', symbol, range, resolution)
  const result = [] as CandleDatum[]
  console.log('[DEBUG] queryStocks result length', result.length)
  return result
}

/**
 * Returns the expected range of the data
 * @param input the input to the procedure
 * @returns the expected range of the data
 */
function expectedDataRange({ range, resolution }: z.infer<typeof input>) {
  let [from, to] = range
  const timeUnit = getUnit(resolution)
  const round = (date: Date, fn: (x: number) => number) =>
    new Date(fn(date.getTime() / timeUnit) * timeUnit)
  from = round(from, Math.ceil)
  to = round(to, Math.floor)
  const diff = to.getTime() - from.getTime() - timeUnit
  console.log('[DEBUG] expectedDataRange ', from, to, diff)
  return diff
}

/**
 * The procedure for getting stock candles
 * @param input the input to the procedure
 * @returns the stock candles
 * @throws an error if the input is invalid
 */
export const stockCandles = publicProcedure
  .input(input)
  .output(output)
  .query(async ({ input }) => {
    const expectedRange = expectedDataRange(input)
    let data = await queryStocks(input)
    const dataRange = getDataRange(data)
    if (dataRange < expectedRange) {
      console.log('[DEBUG] input', input)
      data = await getCandles(input)
      console.log('[DEBUG] getCandles', data.length)
      return data
    }
    return data
  })

export default createProcedure(stockCandles)
