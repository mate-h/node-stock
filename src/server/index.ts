import express from 'express'
import type { ViteDevServer } from 'vite'
import { initFirebase } from './admin.js'
import { createMiddleware } from './api.js'
import { createSsrMiddleware, filePaths } from './ssr.js'

const isTest = process.env.VITEST

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort?: number
) {
  initFirebase()

  const app = express()

  let vite: ViteDevServer | undefined
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
  } else {
    app.use((await import('compression')).default())
    app.use(
      (await import('serve-static')).default(filePaths.clientProd, {
        index: false,
      })
    )
  }

  app.use('/api', createMiddleware())

  app.use('*', createSsrMiddleware({ isProd, vite }))

  return { app, vite: vite! }
}
