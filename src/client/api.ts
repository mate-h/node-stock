import { CandleDatum, GetCandles } from '@mateh/react-stock'
import { apiClient } from './trpc'
import lodash from 'lodash'

const hashCode = (input: Parameters<GetCandles>[0]) => {
  let [from, to] = input.range
  // remove milliseconds
  from = new Date(from.getTime() - from.getMilliseconds())
  to = new Date(to.getTime() - to.getMilliseconds())
  const str = JSON.stringify(lodash.set(input, 'range', [from, to]))
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

const hashMap: Record<number, CandleDatum[]> = {}
const promises: Record<number, Promise<CandleDatum[]>> = {}

export const getCandles: GetCandles = async (input) => {
  const hash = hashCode(input)
  if (hash in promises) {
    return promises[hash]
  }
  if (hash in hashMap) {
    return hashMap[hash]
  }
  promises[hash] = apiClient.stockCandles.query(input)
  const candles = await promises[hash]
  hashMap[hash] = candles
  return candles
}
