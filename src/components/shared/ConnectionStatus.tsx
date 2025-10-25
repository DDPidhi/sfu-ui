import { useEffect, useState } from 'react';
import websocketService from '../../services/websocketService';

export function ConnectionStatus() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsConnected(websocketService.isConnected);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (isConnected) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]">
            ⚠️ Disconnected from server
        </div>
    );
}