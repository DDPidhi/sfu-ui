import { useCallback } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { open } = useAppKit()

  const connect = useCallback(async () => {
    try {
      await open()
      return address || null
    } catch (err) {
      console.error('Failed to open wallet modal:', err)
      return null
    }
  }, [open, address])

  const disconnect = useCallback(() => {
    wagmiDisconnect()
  }, [wagmiDisconnect])

  // Format address for display (0x1234...5678)
  const formatAddress = useCallback((addr: string | null | undefined) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  return {
    address: address || null,
    isConnecting,
    isConnected,
    error: null,
    connect,
    disconnect,
    formatAddress,
  }
}
