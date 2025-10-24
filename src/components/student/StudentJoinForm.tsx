import { useState } from 'react';
import type {SignalingMessage} from "../../types/signaling.types.ts";
import {useWebSocket} from "../../hooks/useWebSocket.ts";

interface StudentJoinFormProps {
    onJoin: (name: string, roomId: string, peerId: string) => void;
}

export default function StudentJoinForm({ onJoin }: StudentJoinFormProps) {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [peerId] = useState(`student-${Math.random().toString(36).substr(2, 9)}`);
    const [status, setStatus] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    const handleMessage = (msg: SignalingMessage) => {
        console.log('📨 Student received:', msg);

        switch (msg.type) {
            case 'join_request_sent':
                setStatus('Join request sent. Waiting for proctor approval...');
                break;

            case 'join_approved':
                setStatus('Approved! Setting up...');
                // Trigger join flow in parent
                setTimeout(() => {
                    onJoin(name, roomId, peerId);
                }, 500);
                break;

            case 'join_denied':
                setStatus('Join request denied by proctor.');
                setIsRequesting(false);
                break;

            case 'error':
                setStatus(`Error: ${msg.message}`);
                setIsRequesting(false);
                break;
        }
    };

    const { connect, send } = useWebSocket(handleMessage);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || roomId.length !== 6) {
            setStatus('Please enter your name and a valid 6-digit room ID');
            return;
        }

        setIsRequesting(true);
        setStatus('Connecting...');

        try {
            // Connect to WebSocket
            await connect();

            // Send join request
            send({
                type: 'JoinRequest',
                room_id: roomId,
                peer_id: peerId,
                name: name,
                role: 'student'
            });

            setStatus('Requesting to join...');
        } catch (err) {
            setStatus('Failed to connect to server');
            setIsRequesting(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen p-8 bg-gradient-to-br from-primary to-primary-dark">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-12 w-full max-w-md shadow-2xl">
                <h1 className="text-gray-800 text-center mb-8 text-3xl">Join Class</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block mb-2 text-gray-600 font-medium">Your Name</label>
                        <input
                            type="text"
                            className="w-full p-4 border-2 border-gray-300 rounded-xl text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isRequesting}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-gray-600 font-medium">Room ID</label>
                        <input
                            type="text"
                            className="w-full p-4 border-2 border-gray-300 rounded-xl text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                            placeholder="Enter 6-digit room ID"
                            maxLength={6}
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.replace(/\D/g, ''))}
                            disabled={isRequesting}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-4 bg-primary text-white border-0 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
                    >
                        {isRequesting ? 'Joining...' : 'Join Class'}
                    </button>
                </form>
                {status && (
                    <div className="mt-4 p-4 rounded-lg text-center font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
