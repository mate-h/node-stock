import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import type { ViteDevServer } from 'vite'
import type { Render } from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTest = process.env.VITEST

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort?: number
) {
  const resolve = (p: string) => path.resolve(__dirname, p)
  const filePaths = {
    index: resolve('../../index.html'),
    indexProd: resolve('../../dist/client/index.html'),
    entry: resolve('../../src/server/entry.ts'),
    entryProd: resolve('../../dist/server/entry.js'),
    clientProd: resolve('../../dist/client'),
    api: resolve('../../src/server/api.ts'),
    apiProd: resolve('../../src/server/api.js'),
  }

  const indexProd = isProd ? fs.readFileSync(filePaths.indexProd, 'utf-8') : ''

  const app = express()

  let vite: ViteDevServer
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        },
      },
      appType: 'custom',
    })

    // use vite's connect instance as middleware
    app.use(vite!.middlewares)

    const { createMiddleware } = await vite.ssrLoadModule(filePaths.api)
    const apiMiddleware = createMiddleware()
    app.use('/api', apiMiddleware)
  } else {
    app.use((await import('compression')).default())
    app.use(
      (await import('serve-static')).default(filePaths.clientProd, {
        index: false,
      })
    )
    const { createMiddleware } = await import(filePaths.apiProd)
    const apiMiddleware = createMiddleware()
    app.use('/api', apiMiddleware)
  }

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template: string
      let render: Render
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(filePaths.index, 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule(filePaths.entry)).render
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
      !isProd && vite.ssrFixStacktrace(err)
      console.log(err.stack)
      res.status(500).end(err.stack)
    }
  })

  return { app, vite: vite! }
}
