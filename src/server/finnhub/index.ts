import { useEffect } from 'react'
import type {
  CandleResolution,
  GetCandles,
  Listener,
  Subscribe,
} from '@mateh/react-stock'

// finnhub module
const apiRoot = 'https://finnhub.io/api/v1'
const apiToken = 'c9dhq42ad3id6u3ecv30'

export type CandlesResponse = {
  c: number[]
  h: number[]
  l: number[]
  o: number[]
  s: string
  t: number[]
  v: number[]
}

interface SocketMessageBase<Datum, Type = string> {
  type: Type
  data: Datum[]
}

type TradeDatum = {
  /** Lise of trade conditions */
  c: number | null
  /** Price */
  p: number
  /** Symbol */
  s: string
  /** Unix ms timestamp */
  t: number
  /** Volume */
  v: number
}

interface SocketTrade extends SocketMessageBase<TradeDatum, 'trade'> {}

type SocketMessage = SocketTrade

export function getResolution(resolution: CandleResolution): string {
  const lookup: Partial<Record<CandleResolution, string>> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M',
  }
  return lookup[resolution] || '1'
}

export const getCandles: GetCandles = async ({
  symbol,
  type,
  resolution,
  range,
}) => {
  function getUrl() {
    let symbolName = symbol
    const msec = (sec: number) => Math.floor(sec / 1000)
    let from = msec(range[0].getTime())
    let to = msec(range[1].getTime())
    let res = getResolution(resolution)
    return `${apiRoot}/${type}/candle?symbol=${symbolName}&resolution=${res}&from=${from}&to=${to}&token=${apiToken}`
  }
  async function getCandlesImmediate() {
    const u = getUrl();
    console.log('[DEBUG] getCandlesImmediate', u)
    return (await fetch(u).then((res) => res.json())) as CandlesResponse
  }
  return new Promise(async (resolve, reject) => {
    const candles = await getCandlesImmediate()

    if (candles.s !== 'ok') {
      reject(new Error(candles.s))
      return
    }

    resolve(
      candles.t.map((t, i) => ({
        date: new Date(t * 1000),
        open: candles.o[i],
        high: candles.h[i],
        low: candles.l[i],
        close: candles.c[i],
        volume: candles.v[i],
      }))
    )
  })
}

const initSocket = async (callback: (trades: TradeDatum[]) => void) => {
  return new Promise<WebSocket>((resolve) => {
    const endpoint = 'wss://ws.finnhub.io?token=' + apiToken
    const socket = new WebSocket(endpoint)
    socket.onopen = () => {
      socket.send(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:BTCUSDT' })
      )
    }
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as SocketMessage
      if (data.type === 'trade') {
        resolve(socket)
        callback(data.data)
      }
    }
  })
}

export let socket: WebSocket | null = null

export const listeners: Listener[] = []

export const createSocket = (onUpdate: (trades: TradeDatum[]) => void) => {
  const subscribe: Subscribe = (listener) => {
    listeners.push(listener)
  }
  useEffect(() => {
    if (listeners.length === 0) return
    let s: WebSocket | null = null
    async function init() {
      s = await initSocket(onUpdate)
      if (s) {
        socket = s
      }
    }
    init()
    return () => {
      if (s) {
        s.close()
      }
    }
  }, [listeners])
  return { socket, listeners, subscribe }
}

export const createFinnhub = () => {
  const { socket, listeners, subscribe } = createSocket(onUpdate)
  function onUpdate(trades: TradeDatum[]) {
    // update min, max, last

    const totalV = trades.reduce((sum, trade) => sum + trade.v, 0)
    const close =
      trades.reduce((sum, trade) => sum + trade.p * trade.v, 0) / totalV
    const date = new Date(trades[trades.length - 1].t)

    listeners.forEach((listener) => listener({ date, close }))
  }

  return { socket, subscribe }
}
