import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { http } from 'viem'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Chain configuration from environment variables
const chainId = Number(import.meta.env.VITE_CHAIN_ID) || 1287
const chainName = import.meta.env.VITE_CHAIN_NAME || 'Moonbase Alpha'
const chainRpcUrl = import.meta.env.VITE_CHAIN_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network'
const chainExplorerUrl = import.meta.env.VITE_CHAIN_EXPLORER_URL || 'https://moonbase.moonscan.io'
const chainExplorerName = import.meta.env.VITE_CHAIN_EXPLORER_NAME || 'Moonscan'
const chainCurrencyName = import.meta.env.VITE_CHAIN_CURRENCY_NAME || 'DEV'
const chainCurrencySymbol = import.meta.env.VITE_CHAIN_CURRENCY_SYMBOL || 'DEV'

export const appChain = {
  id: chainId,
  name: chainName,
  chainNamespace: 'eip155',
  caipNetworkId: `eip155:${chainId}`,
  nativeCurrency: {
    name: chainCurrencyName,
    symbol: chainCurrencySymbol,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [chainRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: chainExplorerName,
      url: chainExplorerUrl,
    },
  },
  testnet: true,
} as const satisfies AppKitNetwork

// Get project ID from environment or use a placeholder
// You need to get a project ID from https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || ''

if (!projectId) {
  console.warn('VITE_REOWN_PROJECT_ID is not set. Get one from https://cloud.reown.com')
}

// Wagmi adapter configuration
export const wagmiAdapter = new WagmiAdapter({
  networks: [appChain],
  projectId,
  ssr: false,
  transports: {
    [appChain.id]: http(chainRpcUrl),
  },
})

// Create the AppKit modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [appChain],
  projectId,
  metadata: {
    name: 'Proctoring App',
    description: 'Decentralized Proctoring Platform',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  // Only show Talisman wallet
  featuredWalletIds: [
    // Talisman wallet ID
    'b0dc4a7215ebe8e07e3a379e69da11be0c42b40611e74f3bd9c30f8b39258329',
  ],
  includeWalletIds: [
    // Talisman wallet ID
    'b0dc4a7215ebe8e07e3a379e69da11be0c42b40611e74f3bd9c30f8b39258329',
  ],
})

export const config = wagmiAdapter.wagmiConfig
