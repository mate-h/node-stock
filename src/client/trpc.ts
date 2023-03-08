// @filename: client.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server/api'
import superjson from 'superjson'

// Notice the <AppRouter> generic here.
export const apiClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: 'http://localhost:5173/api',
    }),
  ],
})
