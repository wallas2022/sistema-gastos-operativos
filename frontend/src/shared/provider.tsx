import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '../store'

const system = createSystem(defaultConfig)
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } })

export function Provider({ children }: { children: ReactNode }) {
  return <ReduxProvider store={store}><QueryClientProvider client={queryClient}><ChakraProvider value={system}>{children}</ChakraProvider></QueryClientProvider></ReduxProvider>
}
