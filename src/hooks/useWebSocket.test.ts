import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';
import websocketService from '../services/websocketService';
import type { SignalingMessage } from '../types/signaling.types';

// Mock the websocketService
vi.mock('../services/websocketService', () => {
  const handlers = new Set<(msg: SignalingMessage) => void>();

  return {
    default: {
      connect: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
      disconnect: vi.fn(),
      isConnected: false,
      addMessageHandler: vi.fn((handler) => handlers.add(handler)),
      removeMessageHandler: vi.fn((handler) => handlers.delete(handler)),
      // Helper to simulate receiving messages
      _simulateMessage: (msg: SignalingMessage) => {
        handlers.forEach(h => h(msg));
      },
      _getHandlers: () => handlers,
    },
  };
});

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear handlers between tests
    const handlers = (websocketService as any)._getHandlers();
    handlers.clear();
  });

  it('should connect to WebSocket successfully', async () => {
    const { result } = renderHook(() => useWebSocket());

    let connectionResult;
    await act(async () => {
      connectionResult = await result.current.connect();
    });

    expect(connectionResult).toBe(true);
    expect(websocketService.connect).toHaveBeenCalled();
  });

  it('should handle connection failure', async () => {
    vi.mocked(websocketService.connect).mockRejectedValueOnce(new Error('Connection failed'));

    const { result } = renderHook(() => useWebSocket());

    let connectionResult;
    await act(async () => {
      connectionResult = await result.current.connect();
    });

    expect(connectionResult).toBe(false);
  });

  it('should connect with custom URL', async () => {
    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      await result.current.connect('ws://custom-url.com');
    });

    expect(websocketService.connect).toHaveBeenCalledWith('ws://custom-url.com');
  });

  it('should send messages through WebSocket service', () => {
    const { result } = renderHook(() => useWebSocket());

    const message: SignalingMessage = {
      type: 'JoinRequest',
      room_id: '123456',
      peer_id: 'test-peer',
      name: 'Test User',
      role: 'student',
    };

    act(() => {
      result.current.send(message);
    });

    expect(websocketService.send).toHaveBeenCalledWith(message);
  });

  it('should register message handler on mount', () => {
    const mockHandler = vi.fn();
    renderHook(() => useWebSocket(mockHandler));

    expect(websocketService.addMessageHandler).toHaveBeenCalled();
  });

  it('should call onMessage callback when message is received', async () => {
    const mockHandler = vi.fn();
    renderHook(() => useWebSocket(mockHandler));

    const testMessage: SignalingMessage = {
      type: 'join_approved',
      room_id: '123456',
    };

    await act(async () => {
      (websocketService as any)._simulateMessage(testMessage);
    });

    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledWith(testMessage);
    });
  });

  it('should handle multiple message handlers', async () => {
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();

    renderHook(() => useWebSocket(mockHandler1));
    renderHook(() => useWebSocket(mockHandler2));

    const testMessage: SignalingMessage = {
      type: 'join_approved',
      room_id: '123456',
    };

    await act(async () => {
      (websocketService as any)._simulateMessage(testMessage);
    });

    await waitFor(() => {
      expect(mockHandler1).toHaveBeenCalledWith(testMessage);
      expect(mockHandler2).toHaveBeenCalledWith(testMessage);
    });
  });

  it('should remove message handler on unmount', () => {
    const mockHandler = vi.fn();
    const { unmount } = renderHook(() => useWebSocket(mockHandler));

    expect(websocketService.addMessageHandler).toHaveBeenCalled();

    unmount();

    expect(websocketService.removeMessageHandler).toHaveBeenCalled();
  });

  it('should update handler when onMessage callback changes', async () => {
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();

    const { rerender } = renderHook(
      ({ handler }) => useWebSocket(handler),
      { initialProps: { handler: mockHandler1 } }
    );

    const testMessage1: SignalingMessage = {
      type: 'join_approved',
      room_id: '123456',
    };

    await act(async () => {
      (websocketService as any)._simulateMessage(testMessage1);
    });

    await waitFor(() => {
      expect(mockHandler1).toHaveBeenCalledWith(testMessage1);
    });

    // Update handler
    rerender({ handler: mockHandler2 });

    const testMessage2: SignalingMessage = {
      type: 'join_denied',
      room_id: '123456',
    };

    await act(async () => {
      (websocketService as any)._simulateMessage(testMessage2);
    });

    await waitFor(() => {
      expect(mockHandler2).toHaveBeenCalledWith(testMessage2);
      expect(mockHandler1).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  it('should disconnect when disconnect is called', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.disconnect();
    });

    expect(websocketService.disconnect).toHaveBeenCalled();
  });

  it('should handle messages without onMessage callback', async () => {
    renderHook(() => useWebSocket());

    const testMessage: SignalingMessage = {
      type: 'join_approved',
      room_id: '123456',
    };

    // Should not throw error
    await act(async () => {
      (websocketService as any)._simulateMessage(testMessage);
    });

    expect(true).toBe(true);
  });

  it('should provide isConnected status', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(false);
  });
});
