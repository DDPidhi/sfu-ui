import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useExamHistory } from './useExamHistory'

// Mock wagmi hooks
const mockUseReadContract = vi.fn()
const mockUseReadContracts = vi.fn()

vi.mock('wagmi', () => ({
  useReadContract: (config: unknown) => mockUseReadContract(config),
  useReadContracts: (config: unknown) => mockUseReadContracts(config),
}))

vi.mock('../config/contract', () => ({
  PROCTORING_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  PROCTORING_ABI: [],
}))

describe('useExamHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations - no data
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    mockUseReadContracts.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
  })

  describe('when no address provided', () => {
    it('should return empty results', () => {
      const { result } = renderHook(() => useExamHistory(undefined))

      expect(result.current.examResults).toEqual([])
      expect(result.current.rooms).toEqual([])
      expect(result.current.stats.totalExams).toBe(0)
      expect(result.current.stats.completedExams).toBe(0)
      expect(result.current.stats.totalRecordings).toBe(0)
      expect(result.current.stats.averageGrade).toBe(0)
      expect(result.current.stats.roomsJoined).toBe(0)
    })

    it('should not be loading', () => {
      const { result } = renderHook(() => useExamHistory(undefined))

      expect(result.current.isLoading).toBe(false)
    })

    it('should have no error', () => {
      const { result } = renderHook(() => useExamHistory(undefined))

      expect(result.current.error).toBeNull()
    })
  })

  describe('when loading', () => {
    it('should return isLoading true when loading exam IDs', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { result } = renderHook(() => useExamHistory('0x1234'))

      expect(result.current.isLoading).toBe(true)
    })

    it('should return isLoading true when loading exam results', () => {
      mockUseReadContract.mockReturnValue({
        data: [1n, 2n],
        isLoading: false,
        error: null,
      })

      mockUseReadContracts.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      const { result } = renderHook(() => useExamHistory('0x1234'))

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('when error occurs', () => {
    it('should return the error', () => {
      const testError = new Error('Contract call failed')
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: testError,
      })

      const { result } = renderHook(() => useExamHistory('0x1234'))

      expect(result.current.error).toBe(testError)
    })
  })

  describe('with exam data', () => {
    const mockExamResultIds = [1n, 2n]
    const mockRooms = ['room1', 'room2', 'room3']

    const mockExamResult1 = [
      1n, // id
      'room1', // roomId
      '0xabcd', // participant
      8500n, // grade (85.00%)
      'Final Exam', // examName
      1700000000n, // createdAt
      1700000100n, // updatedAt
      false, // nftMinted
      2n, // recordingCount
    ]

    const mockExamResult2 = [
      2n, // id
      'room2', // roomId
      '0xabcd', // participant
      9200n, // grade (92.00%)
      'Midterm Exam', // examName
      1699000000n, // createdAt (earlier)
      1699000100n, // updatedAt
      true, // nftMinted
      1n, // recordingCount
    ]

    beforeEach(() => {
      // Mock getParticipantExamResultIds and getParticipantRooms
      mockUseReadContract.mockImplementation((config: { functionName: string }) => {
        if (config.functionName === 'getParticipantExamResultIds') {
          return {
            data: mockExamResultIds,
            isLoading: false,
            error: null,
          }
        }
        if (config.functionName === 'getParticipantRooms') {
          return {
            data: mockRooms,
            isLoading: false,
            error: null,
          }
        }
        return {
          data: undefined,
          isLoading: false,
          error: null,
        }
      })

      // Mock getExamResult and getExamResultRecordings
      mockUseReadContracts.mockImplementation((config: { contracts: Array<{ functionName: string }> }) => {
        if (config.contracts[0]?.functionName === 'getExamResult') {
          return {
            data: [
              { status: 'success', result: mockExamResult1 },
              { status: 'success', result: mockExamResult2 },
            ],
            isLoading: false,
          }
        }
        if (config.contracts[0]?.functionName === 'getExamResultRecordings') {
          return {
            data: [
              { status: 'success', result: ['QmCid1', 'QmCid2'] },
              { status: 'success', result: ['QmCid3'] },
            ],
            isLoading: false,
          }
        }
        return {
          data: undefined,
          isLoading: false,
        }
      })
    })

    it('should return parsed exam results', () => {
      const { result } = renderHook(() => useExamHistory('0xabcd'))

      expect(result.current.examResults).toHaveLength(2)
    })

    it('should sort exam results by createdAt descending', () => {
      const { result } = renderHook(() => useExamHistory('0xabcd'))

      // First result should be the one with higher createdAt (Final Exam)
      expect(result.current.examResults[0].examName).toBe('Final Exam')
      expect(result.current.examResults[1].examName).toBe('Midterm Exam')
    })

    it('should include recordings in exam results', () => {
      const { result } = renderHook(() => useExamHistory('0xabcd'))

      expect(result.current.examResults[0].recordings).toEqual(['QmCid1', 'QmCid2'])
      expect(result.current.examResults[1].recordings).toEqual(['QmCid3'])
    })

    it('should return rooms list', () => {
      const { result } = renderHook(() => useExamHistory('0xabcd'))

      expect(result.current.rooms).toEqual(mockRooms)
    })

    it('should calculate correct stats', () => {
      const { result } = renderHook(() => useExamHistory('0xabcd'))

      expect(result.current.stats.totalExams).toBe(2)
      expect(result.current.stats.completedExams).toBe(2) // Both have grade > 0
      expect(result.current.stats.totalRecordings).toBe(3) // 2 + 1
      expect(result.current.stats.roomsJoined).toBe(3)
      // Average grade: (8500 + 9200) / 2 / 100 = 88.5
      expect(result.current.stats.averageGrade).toBe(88.5)
    })
  })

  describe('with failed contract calls', () => {
    it('should filter out failed exam result calls', () => {
      mockUseReadContract.mockImplementation((config: { functionName: string }) => {
        if (config.functionName === 'getParticipantExamResultIds') {
          return {
            data: [1n, 2n],
            isLoading: false,
            error: null,
          }
        }
        return {
          data: [],
          isLoading: false,
          error: null,
        }
      })

      mockUseReadContracts.mockImplementation((config: { contracts: Array<{ functionName: string }> }) => {
        if (config.contracts[0]?.functionName === 'getExamResult') {
          return {
            data: [
              { status: 'success', result: [1n, 'room1', '0xabcd', 8500n, 'Exam 1', 1700000000n, 1700000100n, false, 1n] },
              { status: 'failure', result: null }, // This one failed
            ],
            isLoading: false,
          }
        }
        return {
          data: [],
          isLoading: false,
        }
      })

      const { result } = renderHook(() => useExamHistory('0xabcd'))

      // Should only have 1 result (the successful one)
      expect(result.current.examResults).toHaveLength(1)
      expect(result.current.examResults[0].roomId).toBe('room1')
    })
  })

  describe('with no completed exams', () => {
    it('should return 0 completed exams when all grades are 0', () => {
      mockUseReadContract.mockImplementation((config: { functionName: string }) => {
        if (config.functionName === 'getParticipantExamResultIds') {
          return {
            data: [1n],
            isLoading: false,
            error: null,
          }
        }
        return {
          data: [],
          isLoading: false,
          error: null,
        }
      })

      mockUseReadContracts.mockImplementation((config: { contracts: Array<{ functionName: string }> }) => {
        if (config.contracts[0]?.functionName === 'getExamResult') {
          return {
            data: [
              { status: 'success', result: [1n, 'room1', '0xabcd', 0n, 'Pending Exam', 1700000000n, 1700000100n, false, 0n] },
            ],
            isLoading: false,
          }
        }
        return {
          data: [],
          isLoading: false,
        }
      })

      const { result } = renderHook(() => useExamHistory('0xabcd'))

      expect(result.current.stats.totalExams).toBe(1)
      expect(result.current.stats.completedExams).toBe(0)
      expect(result.current.stats.averageGrade).toBe(0)
    })
  })
})
