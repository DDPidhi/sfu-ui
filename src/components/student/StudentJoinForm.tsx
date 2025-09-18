import { useState } from 'react';

interface StudentJoinFormProps {
    onJoin: (name: string, roomId: string) => void;
}

export default function StudentJoinForm({ onJoin }: StudentJoinFormProps) {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || roomId.length !== 6) {
            setStatus('Please enter your name and a valid 6-digit room ID');
            return;
        }

        setStatus('Requesting to join...');
        // Simulate approval delay
        setTimeout(() => {
            onJoin(name, roomId);
        }, 1500);
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
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-4 bg-primary text-white border-0 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
                    >
                        Join Class
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
