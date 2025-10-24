import { useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';
import type {SignalingMessage} from '../types/signaling.types';

export const useWebSocket = (onMessage?: (message: SignalingMessage) => void) => {
    const messageHandlerRef = useRef(onMessage);

    // Update ref when handler changes
    useEffect(() => {
        messageHandlerRef.current = onMessage;
    }, [onMessage]);

    const connect = useCallback(async (url?: string) => {
        try {
            await websocketService.connect(url);
            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            return false;
        }
    }, []);

    const send = useCallback((message: SignalingMessage) => {
        websocketService.send(message);
    }, []);

    useEffect(() => {
        const handler = (msg: SignalingMessage) => {
            if (messageHandlerRef.current) {
                messageHandlerRef.current(msg);
            }
        };

        websocketService.addMessageHandler(handler);

        return () => {
            websocketService.removeMessageHandler(handler);
        };
    }, []);

    return {
        connect,
        send,
        disconnect: () => websocketService.disconnect(),
        isConnected: websocketService.isConnected
    };
};
