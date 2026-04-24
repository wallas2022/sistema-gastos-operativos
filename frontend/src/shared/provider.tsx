import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import type { ReactNode } from 'react'

const system = createSystem(defaultConfig)

export function Provider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>
}
