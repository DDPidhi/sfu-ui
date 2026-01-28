// Contract ABI for reading exam results
export const PROCTORING_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x6b044B2951dAF31F37D1AdB6547EA673AdF56DBB'

export const PROCTORING_ABI = [
  // Read functions
  {
    name: 'getParticipantExamResultIds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'participant', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getExamResult',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'resultId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'roomId', type: 'string' },
      { name: 'participant', type: 'address' },
      { name: 'grade', type: 'uint256' },
      { name: 'examName', type: 'string' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'nftMinted', type: 'bool' },
      { name: 'recordingCount', type: 'uint256' },
    ],
  },
  {
    name: 'getExamResultRecordings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'resultId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string[]' }],
  },
  {
    name: 'getParticipantRooms',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'participant', type: 'address' }],
    outputs: [{ name: '', type: 'string[]' }],
  },
  {
    name: 'participantNames',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const
