import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWallet } from './useWallet'

// Mock wagmi hooks
const mockUseAccount = vi.fn()
const mockUseDisconnect = vi.fn()
const mockUseAppKit = vi.fn()

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useDisconnect: () => mockUseDisconnect(),
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: () => mockUseAppKit(),
}))

describe('useWallet', () => {
  const mockDisconnect = vi.fn()
  const mockOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
    })

    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    })

    mockUseAppKit.mockReturnValue({
      open: mockOpen,
    })
  })

  describe('initial state', () => {
    it('should return disconnected state when no wallet connected', () => {
      const { result } = renderHook(() => useWallet())

      expect(result.current.address).toBeNull()
      expect(result.current.isConnected).toBe(false)
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should return connected state with address when wallet is connected', () => {
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockUseAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      })

      const { result } = renderHook(() => useWallet())

      expect(result.current.address).toBe(testAddress)
      expect(result.current.isConnected).toBe(true)
      expect(result.current.isConnecting).toBe(false)
    })

    it('should return connecting state during connection', () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: true,
      })

      const { result } = renderHook(() => useWallet())

      expect(result.current.isConnecting).toBe(true)
      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('connect', () => {
    it('should call open when connect is called', async () => {
      mockOpen.mockResolvedValue(undefined)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect()
      })

      expect(mockOpen).toHaveBeenCalledTimes(1)
    })

    it('should return address after successful connection', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockUseAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      })
      mockOpen.mockResolvedValue(undefined)

      const { result } = renderHook(() => useWallet())

      let returnedAddress: string | null = null
      await act(async () => {
        returnedAddress = await result.current.connect()
      })

      expect(returnedAddress).toBe(testAddress)
    })

    it('should return null when open fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockOpen.mockRejectedValue(new Error('User rejected'))

      const { result } = renderHook(() => useWallet())

      let returnedAddress: string | null = 'should be null'
      await act(async () => {
        returnedAddress = await result.current.connect()
      })

      expect(returnedAddress).toBeNull()
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  describe('disconnect', () => {
    it('should call wagmi disconnect when disconnect is called', () => {
      const testAddress = '0x1234567890123456789012345678901234567890'
      mockUseAccount.mockReturnValue({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      })

      const { result } = renderHook(() => useWallet())

      act(() => {
        result.current.disconnect()
      })

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('formatAddress', () => {
    it('should format address correctly', () => {
      const { result } = renderHook(() => useWallet())

      const formatted = result.current.formatAddress('0x1234567890123456789012345678901234567890')

      expect(formatted).toBe('0x1234...7890')
    })

    it('should return empty string for null address', () => {
      const { result } = renderHook(() => useWallet())

      const formatted = result.current.formatAddress(null)

      expect(formatted).toBe('')
    })

    it('should return empty string for undefined address', () => {
      const { result } = renderHook(() => useWallet())

      const formatted = result.current.formatAddress(undefined)

      expect(formatted).toBe('')
    })

    it('should handle short addresses', () => {
      const { result } = renderHook(() => useWallet())

      const formatted = result.current.formatAddress('0x1234')

      // Should still work even with short addresses
      expect(formatted).toBe('0x1234...1234')
    })
  })
})
