'use client'
import { queryClient } from '@/lib/queryClient'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type * as React from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
