import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaDevices } from './useMediaDevices';

describe('useMediaDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startMedia', () => {
    it('should successfully get user media stream', async () => {
      const { result } = renderHook(() => useMediaDevices());

      expect(result.current.localStream).toBeNull();

      await act(async () => {
        const stream = await result.current.startMedia();
        expect(stream).toBeDefined();
      });

      await waitFor(() => {
        expect(result.current.localStream).not.toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle permission denial and retry with degraded quality', async () => {
      const mockGetUserMedia = vi.spyOn(navigator.mediaDevices, 'getUserMedia');

      // First call fails
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
      // Second call succeeds with degraded constraints
      mockGetUserMedia.mockResolvedValueOnce({
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      } as unknown as MediaStream);

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.startMedia();
      });

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
        // First call with default constraints
        expect(mockGetUserMedia).toHaveBeenNthCalledWith(1, {
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        // Second call with degraded constraints
        expect(mockGetUserMedia).toHaveBeenNthCalledWith(2, {
          video: { width: 640, height: 480 },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      });

      mockGetUserMedia.mockRestore();
    });

    it('should set error after all retries fail', async () => {
      const mockGetUserMedia = vi.spyOn(navigator.mediaDevices, 'getUserMedia');
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        try {
          await result.current.startMedia();
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Permission denied');
        expect(result.current.localStream).toBeNull();
      });

      mockGetUserMedia.mockRestore();
    });

    it('should use custom constraints when provided', async () => {
      const mockGetUserMedia = vi.spyOn(navigator.mediaDevices, 'getUserMedia');
      const { result } = renderHook(() => useMediaDevices());

      const customConstraints = {
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true },
      };

      await act(async () => {
        await result.current.startMedia(customConstraints);
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith(customConstraints);
      mockGetUserMedia.mockRestore();
    });
  });

  describe('stopMedia', () => {
    it('should call stopMedia without errors', async () => {
      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.startMedia();
      });

      await waitFor(() => expect(result.current.localStream).not.toBeNull());

      // Should not throw when stopping
      act(() => {
        result.current.stopMedia();
      });

      // Function exists and can be called
      expect(result.current.stopMedia).toBeDefined();
    });
  });

  describe('toggleVideo', () => {
    it('should call toggleVideo without errors', async () => {
      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.startMedia();
      });

      await waitFor(() => expect(result.current.localStream).not.toBeNull());

      // Should not throw when toggling
      act(() => {
        result.current.toggleVideo();
      });

      act(() => {
        result.current.toggleVideo();
      });

      // Function exists and can be called
      expect(result.current.toggleVideo).toBeDefined();
    });

    it('should handle toggle when no stream exists', () => {
      const { result } = renderHook(() => useMediaDevices());

      // Should not throw error
      act(() => {
        result.current.toggleVideo();
      });

      expect(result.current.isVideoEnabled).toBe(true);
    });
  });

  describe('toggleAudio', () => {
    it('should call toggleAudio without errors', async () => {
      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.startMedia();
      });

      await waitFor(() => expect(result.current.localStream).not.toBeNull());

      // Should not throw when toggling
      act(() => {
        result.current.toggleAudio();
      });

      act(() => {
        result.current.toggleAudio();
      });

      // Function exists and can be called
      expect(result.current.toggleAudio).toBeDefined();
    });

    it('should handle toggle when no stream exists', () => {
      const { result } = renderHook(() => useMediaDevices());

      // Should not throw error
      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.isAudioEnabled).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should have localStream before unmount', async () => {
      const { result, unmount } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.startMedia();
      });

      await waitFor(() => expect(result.current.localStream).not.toBeNull());

      expect(result.current.localStream).not.toBeNull();

      unmount();
      // After unmount, cleanup should have been called
    });
  });
});