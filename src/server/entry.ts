import { Render } from './types'

export const render: Render = (request) => {
  const url = request.originalUrl
  const body = /*html*/ `<div>Server body: ${url}</div>`
  const head = /*html*/ `<title>Server head: ${url}</title>`
  return { body, head }
}
