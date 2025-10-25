import type {SignalingMessage} from '../types/signaling.types';

type MessageHandler = (message: SignalingMessage) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    public isConnected: boolean = false;

    connect(url?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const wsUrl = url || import.meta.env.VITE_WS_URL;

            console.log('Connecting to WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as SignalingMessage;
                    console.log('Received:', message);
                    this.messageHandlers.forEach(handler => handler(message));
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log(' WebSocket closed');
                this.isConnected = false;
            };
        });
    }

    send(message: SignalingMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('Sending:', message);
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket not connected');
        }
    }

    addMessageHandler(handler: MessageHandler): void {
        this.messageHandlers.add(handler);
    }

    removeMessageHandler(handler: MessageHandler): void {
        this.messageHandlers.delete(handler);
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
}

export default new WebSocketService();
