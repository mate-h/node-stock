import React from 'react'
import { Chart, Source, CandleData } from '@mateh/react-stock'
import { getCandles } from './api'

export const App = () => {
  return (
    <Chart>
      <Source getCandles={getCandles} />
      <CandleData />
    </Chart>
  )
}
