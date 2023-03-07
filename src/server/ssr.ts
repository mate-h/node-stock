import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Render } from './types'
import { ViteDevServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const resolve = (p: string) => path.resolve(__dirname, p)
export const filePaths = {
  index: resolve('../../index.html'),
  indexProd: resolve('../../dist/client/index.html'),
  entry: resolve('../../src/server/entry.ts'),
  entryProd: resolve('../../dist/server/entry.js'),
  clientProd: resolve('../../dist/client'),
}

type Props = {
  isProd: boolean
  vite?: ViteDevServer
}

export function createSsrMiddleware({ isProd, vite }: Props) {
  const indexProd = isProd ? fs.readFileSync(filePaths.indexProd, 'utf-8') : ''
  return async (req, res) => {
    try {
      const url = req.originalUrl

      let template: string
      let render: Render
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(filePaths.index, 'utf-8')
        template = await vite!.transformIndexHtml(url, template)
        render = (await vite!.ssrLoadModule(filePaths.entry)).render
      } else {
        template = indexProd
        // @ts-ignore
        render = (await import(filePaths.entryProd)).render
      }

      const { body, head, redirect } = render(req)

      if (redirect) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, redirect)
      }

      const html = template
        .replace(`<!--app-body-->`, body)
        .replace(`<!--app-head-->`, head)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      const err = e as Error
      !isProd && vite!.ssrFixStacktrace(err)
      console.log(err.stack)
      res.status(500).end(err.stack)
    }
  }
}
