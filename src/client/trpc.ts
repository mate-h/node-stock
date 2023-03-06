// @filename: client.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server/api'

// Notice the <AppRouter> generic here.
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
})
