import { useReadContract, useReadContracts } from 'wagmi'
import { PROCTORING_CONTRACT_ADDRESS, PROCTORING_ABI } from '../config/contract'

export interface ExamResult {
  id: bigint
  roomId: string
  participant: string
  grade: bigint
  examName: string
  createdAt: bigint
  updatedAt: bigint
  nftMinted: boolean
  recordingCount: bigint
  recordings?: string[]
}

export function useExamHistory(address: string | undefined) {
  // Get all exam result IDs for the participant
  const { data: examResultIds, isLoading: isLoadingIds, error: idsError } = useReadContract({
    address: PROCTORING_CONTRACT_ADDRESS as `0x${string}`,
    abi: PROCTORING_ABI,
    functionName: 'getParticipantExamResultIds',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Get all rooms the participant has joined
  const { data: rooms, isLoading: isLoadingRooms } = useReadContract({
    address: PROCTORING_CONTRACT_ADDRESS as `0x${string}`,
    abi: PROCTORING_ABI,
    functionName: 'getParticipantRooms',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Prepare contract calls for each exam result
  const examResultCalls = (examResultIds || []).map((id) => ({
    address: PROCTORING_CONTRACT_ADDRESS as `0x${string}`,
    abi: PROCTORING_ABI,
    functionName: 'getExamResult' as const,
    args: [id] as const,
  }))

  // Fetch all exam results
  const { data: examResultsData, isLoading: isLoadingResults } = useReadContracts({
    contracts: examResultCalls,
    query: {
      enabled: examResultCalls.length > 0,
    },
  })

  // Prepare contract calls for recordings
  const recordingsCalls = (examResultIds || []).map((id) => ({
    address: PROCTORING_CONTRACT_ADDRESS as `0x${string}`,
    abi: PROCTORING_ABI,
    functionName: 'getExamResultRecordings' as const,
    args: [id] as const,
  }))

  // Fetch all recordings
  const { data: recordingsData, isLoading: isLoadingRecordings } = useReadContracts({
    contracts: recordingsCalls,
    query: {
      enabled: recordingsCalls.length > 0,
    },
  })

  // Parse exam results
  const examResults: ExamResult[] = (examResultsData || [])
    .map((result, index) => {
      if (result.status !== 'success' || !result.result) return null

      const [id, roomId, participant, grade, examName, createdAt, updatedAt, nftMinted, recordingCount] = result.result as [
        bigint, string, string, bigint, string, bigint, bigint, boolean, bigint
      ]

      const recordings = recordingsData?.[index]?.status === 'success'
        ? (recordingsData[index].result as string[])
        : []

      return {
        id,
        roomId,
        participant,
        grade,
        examName,
        createdAt,
        updatedAt,
        nftMinted,
        recordingCount,
        recordings,
      } as ExamResult
    })
    .filter((r): r is ExamResult => r !== null)
    // Sort by createdAt descending (latest first)
    .sort((a, b) => Number(b.createdAt - a.createdAt))

  // Calculate statistics
  const totalExams = examResults.length
  const completedExams = examResults.filter(e => e.grade > 0n).length
  const totalRecordings = examResults.reduce((sum, e) => sum + (e.recordings?.length || 0), 0)
  const averageGrade = totalExams > 0
    ? examResults.reduce((sum, e) => sum + Number(e.grade), 0) / totalExams / 100
    : 0

  return {
    examResults,
    rooms: rooms || [],
    stats: {
      totalExams,
      completedExams,
      totalRecordings,
      averageGrade,
      roomsJoined: (rooms || []).length,
    },
    isLoading: isLoadingIds || isLoadingResults || isLoadingRecordings || isLoadingRooms,
    error: idsError,
  }
}
