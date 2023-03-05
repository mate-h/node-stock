import type { Request } from 'express'
export type Render = (request: Request) => {
  body: string
  head: string
  redirect?: string
}
