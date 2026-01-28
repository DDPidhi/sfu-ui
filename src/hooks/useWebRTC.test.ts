import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWebRTC } from './useWebRTC'

describe('useWebRTC', () => {
  let mockLocalStream: MediaStream

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock local stream with tracks using the global mocks from setup.ts
    const mockVideoTrack = {
      kind: 'video',
      id: 'video-track-1',
      enabled: true,
      stop: vi.fn(),
      readyState: 'live',
    } as unknown as MediaStreamTrack

    const mockAudioTrack = {
      kind: 'audio',
      id: 'audio-track-1',
      enabled: true,
      stop: vi.fn(),
      readyState: 'live',
    } as unknown as MediaStreamTrack

    mockLocalStream = new MediaStream([mockVideoTrack, mockAudioTrack])
  })

  describe('initial state', () => {
    it('should return null peerConnection initially', () => {
      const { result } = renderHook(() => useWebRTC({
        localStream: null,
        onRemoteTrack: undefined,
      }))

      expect(result.current.peerConnection).toBeNull()
    })

    it('should return all required functions', () => {
      const { result } = renderHook(() => useWebRTC({
        localStream: null,
        onRemoteTrack: undefined,
      }))

      expect(typeof result.current.handleOffer).toBe('function')
      expect(typeof result.current.handleRenegotiation).toBe('function')
      expect(typeof result.current.addIceCandidate).toBe('function')
      expect(typeof result.current.close).toBe('function')
    })
  })

  describe('handleOffer', () => {
    it('should create peer connection when handling offer', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      let answerSdp: string = ''
      await act(async () => {
        answerSdp = await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      expect(answerSdp).toBe('mock-answer-sdp')
    })

    it('should update peerConnection state after handling offer', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      expect(result.current.peerConnection).toBeNull()

      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      expect(result.current.peerConnection).not.toBeNull()
    })

    it('should trigger ICE candidate callback', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      // Wait for the ICE candidate callback (the mock triggers it after 50ms)
      await waitFor(() => {
        expect(onIceCandidate).toHaveBeenCalled()
      }, { timeout: 200 })
    })

    it('should call onRemoteTrack when remote track is received', async () => {
      const onIceCandidate = vi.fn()
      const onRemoteTrack = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack,
      }))

      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      // Simulate remote track event
      const pc = result.current.peerConnection
      if (pc && pc.ontrack) {
        const mockTrackEvent = {
          track: { kind: 'video', id: 'remote-video' },
          streams: [],
        } as unknown as RTCTrackEvent

        act(() => {
          pc.ontrack!(mockTrackEvent)
        })

        expect(onRemoteTrack).toHaveBeenCalledWith(mockTrackEvent)
      }
    })

    it('should reuse existing peer connection on subsequent offers', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp-1', onIceCandidate)
      })

      const firstPc = result.current.peerConnection

      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp-2', onIceCandidate)
      })

      // Should reuse the same peer connection
      expect(result.current.peerConnection).toBe(firstPc)
    })
  })

  describe('handleRenegotiation', () => {
    it('should throw error if no peer connection exists', async () => {
      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      await expect(
        act(async () => {
          await result.current.handleRenegotiation('mock-offer-sdp')
        })
      ).rejects.toThrow('No peer connection')
    })

    it('should handle renegotiation with existing peer connection', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      // First create a peer connection
      await act(async () => {
        await result.current.handleOffer('initial-offer-sdp', onIceCandidate)
      })

      // Now renegotiate
      let answerSdp: string = ''
      await act(async () => {
        answerSdp = await result.current.handleRenegotiation('renegotiation-offer-sdp')
      })

      expect(answerSdp).toBe('mock-answer-sdp')
    })
  })

  describe('addIceCandidate', () => {
    it('should not throw when no peer connection exists', async () => {
      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      // Should not throw
      await act(async () => {
        await result.current.addIceCandidate({ candidate: 'mock-candidate' })
      })
    })

    it('should add ICE candidate to peer connection', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      // First create a peer connection
      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      // Now add ICE candidate - should not throw
      await act(async () => {
        await result.current.addIceCandidate({
          candidate: 'mock-candidate',
          sdpMid: '0',
          sdpMLineIndex: 0,
        })
      })
    })
  })

  describe('close', () => {
    it('should do nothing when no peer connection exists', () => {
      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      // Should not throw
      act(() => {
        result.current.close()
      })
    })

    it('should close peer connection and reset state', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: mockLocalStream,
        onRemoteTrack: undefined,
      }))

      // First create a peer connection
      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      expect(result.current.peerConnection).not.toBeNull()

      // Now close
      act(() => {
        result.current.close()
      })

      expect(result.current.peerConnection).toBeNull()
    })
  })

  describe('without local stream', () => {
    it('should still create peer connection', async () => {
      const onIceCandidate = vi.fn()

      const { result } = renderHook(() => useWebRTC({
        localStream: null,
        onRemoteTrack: undefined,
      }))

      await act(async () => {
        await result.current.handleOffer('mock-offer-sdp', onIceCandidate)
      })

      expect(result.current.peerConnection).not.toBeNull()
    })
  })
})
